use globset::{Glob, GlobSet, GlobSetBuilder};
use napi::bindgen_prelude::*;
use napi_derive::napi;
use serde::Deserialize;

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ElementDescriptor {
  pub r#type: String,
  pub pattern: String,
}

#[derive(Debug, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct AnalyzeFileInput {
  pub file_path: String,
  pub root_path: String,
  pub elements: Vec<ElementDescriptor>,
  #[serde(default)]
  pub ignore: Vec<String>,
}

#[napi(object)]
pub struct AnalyzeFileResult {
  pub known: bool,
  pub matched_element_type: Option<String>,
}

fn compile_globset(patterns: &[String]) -> Result<GlobSet> {
  let mut builder = GlobSetBuilder::new();

  for pattern in patterns {
    let glob = Glob::new(pattern).map_err(|e| Error::from_reason(e.to_string()))?;
    builder.add(glob);
  }

  builder
    .build()
    .map_err(|e| Error::from_reason(e.to_string()))
}

fn normalize_to_relative(path: &str, root: &str) -> String {
  if let Some(stripped) = path.strip_prefix(root) {
    let trimmed = stripped.trim_start_matches('/').trim_start_matches('\\');
    return trimmed.replace('\\', "/");
  }

  path.replace('\\', "/")
}

#[napi]
pub fn analyze_file(input_json: String) -> Result<AnalyzeFileResult> {
  let input: AnalyzeFileInput = serde_json::from_str(&input_json)
    .map_err(|e| Error::from_reason(format!("Invalid input payload: {e}")))?;

  let relative_file = normalize_to_relative(&input.file_path, &input.root_path);

  if !input.ignore.is_empty() {
    let ignore_set = compile_globset(&input.ignore)?;
    if ignore_set.is_match(&relative_file) {
      return Ok(AnalyzeFileResult {
        known: true,
        matched_element_type: None,
      });
    }
  }

  for element in input.elements {
    let mut builder = GlobSetBuilder::new();
    let glob = Glob::new(&element.pattern).map_err(|e| Error::from_reason(e.to_string()))?;
    builder.add(glob);
    let matcher = builder
      .build()
      .map_err(|e| Error::from_reason(e.to_string()))?;

    if matcher.is_match(&relative_file) {
      return Ok(AnalyzeFileResult {
        known: true,
        matched_element_type: Some(element.r#type),
      });
    }
  }

  Ok(AnalyzeFileResult {
    known: false,
    matched_element_type: None,
  })
}
