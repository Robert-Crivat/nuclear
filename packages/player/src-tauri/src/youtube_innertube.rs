use std::sync::{Mutex, OnceLock};
use std::time::{Duration, Instant};

use serde_json::{json, Value};

use crate::ytdlp::{YtdlpSearchResult, YtdlpStreamInfo};

const API_BASE: &str = "https://www.youtube.com/youtubei/v1";
const SEARCH_PARAMS: &str = "EgIQAfABAQ==";
const WEB_CLIENT_VERSION: &str = "2.20260708.00.00";
const VISIONOS_CLIENT_VERSION: &str = "1.02";
const VISIONOS_USER_AGENT: &str = "Mozilla/5.0 (Macintosh; Intel Mac OS X 15_7_3) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/26.0 Safari/605.1.15";
const VISITOR_DATA_TTL: Duration = Duration::from_secs(6 * 60 * 60);
const REQUEST_TIMEOUT: Duration = Duration::from_secs(10);

static CLIENT: OnceLock<reqwest::Client> = OnceLock::new();
static VISITOR_DATA: Mutex<Option<(String, Instant)>> = Mutex::new(None);

fn client() -> Result<&'static reqwest::Client, String> {
    if let Some(client) = CLIENT.get() {
        return Ok(client);
    }
    let client = crate::net::http_client_builder()
        .timeout(REQUEST_TIMEOUT)
        .build()
        .map_err(|error| error.to_string())?;
    Ok(CLIENT.get_or_init(|| client))
}

pub fn parse_visitor_data(body: &str) -> Option<String> {
    let start = body.find('[')?;
    let data: Value = serde_json::from_str(&body[start..]).ok()?;
    data.pointer("/0/2/0/0/13")?.as_str().map(str::to_string)
}

async fn visitor_data() -> Result<String, String> {
    if let Some((value, fetched_at)) = VISITOR_DATA.lock().unwrap().as_ref() {
        if fetched_at.elapsed() < VISITOR_DATA_TTL {
            return Ok(value.clone());
        }
    }
    let body = client()?
        .get("https://www.youtube.com/sw.js_data")
        .header("User-Agent", VISIONOS_USER_AGENT)
        .send()
        .await
        .map_err(|error| error.to_string())?
        .text()
        .await
        .map_err(|error| error.to_string())?;
    let value = parse_visitor_data(&body).ok_or("No visitor data in sw.js_data")?;
    *VISITOR_DATA.lock().unwrap() = Some((value.clone(), Instant::now()));
    Ok(value)
}

fn forget_visitor_data() {
    *VISITOR_DATA.lock().unwrap() = None;
}

async fn post(endpoint: &str, body: Value, headers: &[(&str, &str)]) -> Result<Value, String> {
    let mut request = client()?
        .post(format!("{API_BASE}/{endpoint}?prettyPrint=false"))
        .header("Content-Type", "application/json")
        .header("Origin", "https://www.youtube.com");
    for (name, value) in headers {
        request = request.header(*name, *value);
    }
    request
        .body(body.to_string())
        .send()
        .await
        .map_err(|error| error.to_string())?
        .error_for_status()
        .map_err(|error| error.to_string())?
        .json()
        .await
        .map_err(|error| error.to_string())
}

pub fn parse_duration(text: &str) -> Option<f64> {
    text.split(':').try_fold(0.0, |total, part| {
        part.trim()
            .parse::<f64>()
            .ok()
            .map(|value| total * 60.0 + value)
    })
}

fn collect_video_renderers<'a>(value: &'a Value, renderers: &mut Vec<&'a Value>) {
    match value {
        Value::Object(map) => {
            if let Some(renderer) = map.get("videoRenderer") {
                renderers.push(renderer);
                return;
            }
            map.values()
                .for_each(|child| collect_video_renderers(child, renderers));
        }
        Value::Array(items) => items
            .iter()
            .for_each(|child| collect_video_renderers(child, renderers)),
        _ => {}
    }
}

fn text_of(value: &Value) -> Option<String> {
    value
        .get("simpleText")
        .and_then(Value::as_str)
        .or_else(|| value.pointer("/runs/0/text").and_then(Value::as_str))
        .map(str::to_string)
}

pub fn parse_search_results(response: &Value, limit: usize) -> Vec<YtdlpSearchResult> {
    let mut renderers = Vec::new();
    collect_video_renderers(response, &mut renderers);
    renderers
        .into_iter()
        .filter_map(|renderer| {
            Some(YtdlpSearchResult {
                id: renderer.get("videoId")?.as_str()?.to_string(),
                title: renderer.get("title").and_then(text_of)?,
                duration: renderer
                    .get("lengthText")
                    .and_then(text_of)
                    .and_then(|text| parse_duration(&text)),
                thumbnail: renderer
                    .pointer("/thumbnail/thumbnails")
                    .and_then(Value::as_array)
                    .and_then(|thumbnails| thumbnails.last())
                    .and_then(|thumbnail| thumbnail.get("url"))
                    .and_then(Value::as_str)
                    .map(str::to_string),
                channel: renderer.get("ownerText").and_then(text_of),
            })
        })
        .take(limit)
        .collect()
}

pub async fn search(query: &str, limit: usize) -> Result<Vec<YtdlpSearchResult>, String> {
    let visitor = visitor_data().await?;
    let response = post(
        "search",
        json!({
            "context": { "client": {
                "clientName": "WEB",
                "clientVersion": WEB_CLIENT_VERSION,
                "hl": "en",
                "gl": "US",
                "visitorData": visitor,
            }},
            "query": query,
            "params": SEARCH_PARAMS,
        }),
        &[
            ("X-YouTube-Client-Name", "1"),
            ("X-YouTube-Client-Version", WEB_CLIENT_VERSION),
            ("X-Goog-Visitor-Id", &visitor),
        ],
    )
    .await?;
    Ok(parse_search_results(&response, limit))
}

fn audio_rank(format: &Value) -> Option<(u8, u64)> {
    format.get("url")?;
    let mime_type = format.get("mimeType")?.as_str()?;
    let container_rank = if mime_type.starts_with("audio/mp4") {
        2
    } else if mime_type.starts_with("audio/webm") {
        1
    } else if mime_type.starts_with("audio/") {
        0
    } else {
        return None;
    };
    Some((
        container_rank,
        format.get("bitrate").and_then(Value::as_u64).unwrap_or(0),
    ))
}

fn codec_of(mime_type: &str) -> Option<String> {
    mime_type
        .split("codecs=\"")
        .nth(1)?
        .split('"')
        .next()
        .map(str::to_string)
}

pub fn parse_stream(response: &Value) -> Result<YtdlpStreamInfo, String> {
    let status = response
        .pointer("/playabilityStatus/status")
        .and_then(Value::as_str)
        .unwrap_or("UNKNOWN");
    if status != "OK" {
        return Err(format!("YouTube player status {status}"));
    }
    let format = response
        .pointer("/streamingData/adaptiveFormats")
        .and_then(Value::as_array)
        .and_then(|formats| formats.iter().max_by_key(|format| audio_rank(format)))
        .filter(|format| audio_rank(format).is_some())
        .ok_or("No playable audio format")?;
    let mime_type = format.get("mimeType").and_then(Value::as_str).unwrap_or("");
    let duration = format
        .get("approxDurationMs")
        .and_then(Value::as_str)
        .and_then(|value| value.parse::<f64>().ok())
        .map(|milliseconds| milliseconds / 1000.0)
        .or_else(|| {
            response
                .pointer("/videoDetails/lengthSeconds")
                .and_then(Value::as_str)
                .and_then(|value| value.parse::<f64>().ok())
        });
    Ok(YtdlpStreamInfo {
        stream_url: format["url"].as_str().unwrap_or_default().to_string(),
        duration,
        title: response
            .pointer("/videoDetails/title")
            .and_then(Value::as_str)
            .map(str::to_string),
        container: Some(
            if mime_type.starts_with("audio/mp4") {
                "m4a"
            } else {
                "webm"
            }
            .to_string(),
        ),
        codec: codec_of(mime_type),
        album: None,
        artists: Vec::new(),
        album_artists: Vec::new(),
        upload_date: None,
    })
}

pub fn video_id_from_url(url: &str) -> Option<String> {
    let parsed = reqwest::Url::parse(url).ok()?;
    match parsed.host_str()? {
        "youtu.be" => parsed.path_segments()?.next().map(str::to_string),
        host if host.ends_with("youtube.com") => parsed
            .query_pairs()
            .find(|(key, _)| key == "v")
            .map(|(_, value)| value.into_owned()),
        _ => None,
    }
    .filter(|id| !id.is_empty())
}

pub async fn stream(video_id: &str) -> Result<YtdlpStreamInfo, String> {
    let visitor = visitor_data().await?;
    let response = post(
        "player",
        json!({
            "context": { "client": {
                "clientName": "VISIONOS",
                "clientVersion": VISIONOS_CLIENT_VERSION,
                "deviceMake": "Apple",
                "deviceModel": "RealityDevice17,1",
                "userAgent": VISIONOS_USER_AGENT,
                "osName": "visionOS",
                "osVersion": "26.5.23O471",
                "hl": "en",
                "gl": "US",
                "visitorData": visitor,
            }},
            "videoId": video_id,
            "contentCheckOk": true,
            "racyCheckOk": true,
        }),
        &[
            ("User-Agent", VISIONOS_USER_AGENT),
            ("X-YouTube-Client-Name", "101"),
            ("X-YouTube-Client-Version", VISIONOS_CLIENT_VERSION),
            ("X-Goog-Visitor-Id", &visitor),
        ],
    )
    .await?;
    parse_stream(&response).inspect_err(|_| forget_visitor_data())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn reads_visitor_data_from_sw_js_data() {
        let body = r#")]}'
[[null,null,[[[null,null,null,null,null,null,null,null,null,null,null,null,null,"CgtWSVNJVE9S"]]]]]"#;
        assert_eq!(parse_visitor_data(body), Some("CgtWSVNJVE9S".to_string()));
    }

    #[test]
    fn parses_durations() {
        assert_eq!(parse_duration("4:28"), Some(268.0));
        assert_eq!(parse_duration("1:02:03"), Some(3723.0));
        assert_eq!(parse_duration("live"), None);
    }

    #[test]
    fn parses_search_results() {
        let response = json!({ "contents": { "sectionListRenderer": { "contents": [
            { "itemSectionRenderer": { "contents": [
                { "videoRenderer": {
                    "videoId": "abc",
                    "title": { "runs": [{ "text": "Loser" }] },
                    "lengthText": { "simpleText": "3:44" },
                    "thumbnail": { "thumbnails": [{ "url": "small" }, { "url": "large" }] },
                    "ownerText": { "runs": [{ "text": "Tame Impala" }] }
                }},
                { "adSlotRenderer": {} },
                { "videoRenderer": { "videoId": "def", "title": { "simpleText": "Live" } } }
            ]}}
        ]}}});

        assert_eq!(
            parse_search_results(&response, 10),
            vec![
                YtdlpSearchResult {
                    id: "abc".to_string(),
                    title: "Loser".to_string(),
                    duration: Some(224.0),
                    thumbnail: Some("large".to_string()),
                    channel: Some("Tame Impala".to_string()),
                },
                YtdlpSearchResult {
                    id: "def".to_string(),
                    title: "Live".to_string(),
                    duration: None,
                    thumbnail: None,
                    channel: None,
                },
            ]
        );
        assert_eq!(parse_search_results(&response, 1).len(), 1);
    }

    #[test]
    fn picks_the_best_m4a_audio_format() {
        let response = json!({
            "playabilityStatus": { "status": "OK" },
            "videoDetails": { "title": "Loser", "lengthSeconds": "224" },
            "streamingData": { "adaptiveFormats": [
                { "itag": 137, "mimeType": "video/mp4; codecs=\"avc1\"", "bitrate": 4000000, "url": "video" },
                { "itag": 251, "mimeType": "audio/webm; codecs=\"opus\"", "bitrate": 160000, "url": "opus" },
                { "itag": 139, "mimeType": "audio/mp4; codecs=\"mp4a.40.5\"", "bitrate": 48000, "url": "low" },
                { "itag": 140, "mimeType": "audio/mp4; codecs=\"mp4a.40.2\"", "bitrate": 130000, "url": "m4a", "approxDurationMs": "224000" }
            ]}
        });

        let stream = parse_stream(&response).unwrap();
        assert_eq!(stream.stream_url, "m4a");
        assert_eq!(stream.container.as_deref(), Some("m4a"));
        assert_eq!(stream.codec.as_deref(), Some("mp4a.40.2"));
        assert_eq!(stream.duration, Some(224.0));
        assert_eq!(stream.title.as_deref(), Some("Loser"));
    }

    #[test]
    fn rejects_unplayable_videos_and_ciphered_formats() {
        let blocked = json!({ "playabilityStatus": { "status": "LOGIN_REQUIRED" } });
        assert!(parse_stream(&blocked).is_err());

        let ciphered = json!({
            "playabilityStatus": { "status": "OK" },
            "streamingData": { "adaptiveFormats": [
                { "mimeType": "audio/mp4; codecs=\"mp4a.40.2\"", "signatureCipher": "s=..." }
            ]}
        });
        assert!(parse_stream(&ciphered).is_err());
    }

    #[test]
    fn reads_video_ids_from_youtube_urls() {
        assert_eq!(
            video_id_from_url("https://www.youtube.com/watch?v=s3a4OQR-10M"),
            Some("s3a4OQR-10M".to_string())
        );
        assert_eq!(
            video_id_from_url("https://youtu.be/s3a4OQR-10M"),
            Some("s3a4OQR-10M".to_string())
        );
        assert_eq!(video_id_from_url("https://soundcloud.com/track"), None);
    }
}
