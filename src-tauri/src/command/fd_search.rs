use crate::{
    services::fd_search::{FdSearch, SearchOptions, SearchResult},
    utils::{error::AppError, response::ApiResponse},
};

#[tauri::command]
pub async fn fd_search(
    options: SearchOptions,
) -> Result<ApiResponse<Vec<SearchResult>>, AppError> {
    FdSearch::search(options)
        .map(ApiResponse::success)
        .map_err(AppError::from)
}
