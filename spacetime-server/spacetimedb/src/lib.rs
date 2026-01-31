// SpacetimeDB imports must be at the top
use spacetimedb::{table, reducer, ReducerContext, Table};

// --- Table Definitions ---

#[table(name = user_signer, public)]
#[derive(Clone)]
pub struct UserSigner {
    #[primary_key]
    signer_uuid: String,
    #[index(btree)]
    user_fid: u64,
    public_key: String,
    // allowed: pending_approval, approved, revoked
    status: String,
    // unix timestamp (seconds)
    created_at: u64,
}

#[table(name = scheduled_post, public)]
#[derive(Clone)]
pub struct ScheduledPost {
    #[primary_key]
    id: String,
    #[index(btree)]
    user_fid: u64,
    signer_uuid: String,
    text: String,
    // unix timestamp (seconds)
    #[index(btree)]
    scheduled_time: u64,
    channel_id: Option<String>,
    channel_name: Option<String>,
    channel_image: Option<String>,
    // allowed: pending, posted, failed, skipped
    #[index(btree)]
    status: String,
    cast_hash: Option<String>,
    error: Option<String>,
    // unix timestamp (seconds)
    posted_at: Option<u64>,
}

// --- Helper functions ---

fn now_unix_seconds(ctx: &ReducerContext) -> u64 {
    let micros = ctx.timestamp.to_micros_since_unix_epoch();
    if micros >= 0 {
        (micros as u64) / 1_000_000
    } else {
        0
    }
}

fn normalize_status(s: &str) -> String {
    s.trim().to_ascii_lowercase()
}

fn is_valid_signer_status(s: &str) -> bool {
    matches!(s, "pending_approval" | "approved" | "revoked")
}

fn is_valid_post_status(s: &str) -> bool {
    matches!(s, "pending" | "posted" | "failed" | "skipped")
}

// --- Reducers ---

// 1. Create or update signer for a user
#[reducer]
pub fn create_or_update_signer(
    ctx: &ReducerContext,
    user_fid: u64,
    signer_uuid: String,
    public_key: String,
    status: String,
    created_at: u64,
) -> Result<(), String> {
    let signer_uuid_trimmed = signer_uuid.trim().to_string();
    if signer_uuid_trimmed.is_empty() {
        return Err("signer_uuid must not be empty".into());
    }
    if public_key.trim().is_empty() {
        return Err("public_key must not be empty".into());
    }

    let status_norm = normalize_status(&status);
    if !is_valid_signer_status(&status_norm) {
        return Err("invalid signer status; allowed: pending_approval, approved, revoked".into());
    }

    if let Some(mut signer) = ctx
        .db
        .user_signer()
        .signer_uuid()
        .find(&signer_uuid_trimmed)
    {
        signer.user_fid = user_fid;
        signer.public_key = public_key;
        signer.status = status_norm.clone();
        // Do not overwrite created_at with an older timestamp
        if created_at > 0 && created_at < signer.created_at {
            // keep the earlier created_at
        } else if created_at > 0 {
            signer.created_at = created_at;
        }
        // Store values before update for logging
        let log_uuid = signer.signer_uuid.clone();
        let log_status = signer.status.clone();
        ctx.db.user_signer().signer_uuid().update(signer);
        spacetimedb::log::info!(
            "Updated signer {} for user_fid={} with status={}",
            log_uuid,
            user_fid,
            log_status
        );
        Ok(())
    } else {
        let new_created_at = if created_at > 0 {
            created_at
        } else {
            now_unix_seconds(ctx)
        };
        let row = UserSigner {
            signer_uuid: signer_uuid_trimmed.clone(),
            user_fid,
            public_key,
            status: status_norm.clone(),
            created_at: new_created_at,
        };
        match ctx.db.user_signer().try_insert(row) {
            Ok(inserted) => {
                spacetimedb::log::info!(
                    "Created signer {} for user_fid={} with status={}",
                    inserted.signer_uuid,
                    inserted.user_fid,
                    inserted.status
                );
                Ok(())
            }
            Err(e) => Err(format!("Failed to insert signer: {}", e)),
        }
    }
}

// 2. Get signer information for a user (no-op; clients should query the public table)
#[reducer]
pub fn get_user_signer(_ctx: &ReducerContext, _user_fid: u64) -> Result<(), String> {
    // In SpacetimeDB, clients should directly read from/subscribe to the `user_signer` table,
    // filtering by user_fid and status = 'approved'.
    Ok(())
}

// 3. Create a new scheduled post
#[reducer]
pub fn create_scheduled_post(
    ctx: &ReducerContext,
    id: String,
    user_fid: u64,
    signer_uuid: String,
    text: String,
    scheduled_time: u64,
    channel_id: Option<String>,
    channel_name: Option<String>,
    channel_image: Option<String>,
) -> Result<(), String> {
    let id_trimmed = id.trim().to_string();
    if id_trimmed.is_empty() {
        return Err("id must not be empty".into());
    }
    let signer_uuid_trimmed = signer_uuid.trim().to_string();
    if signer_uuid_trimmed.is_empty() {
        return Err("signer_uuid must not be empty".into());
    }
    if text.trim().is_empty() {
        return Err("text must not be empty".into());
    }
    if scheduled_time == 0 {
        return Err("scheduled_time must be a valid unix timestamp (seconds)".into());
    }

    if ctx.db.scheduled_post().id().find(&id_trimmed).is_some() {
        return Err("scheduled post with this id already exists".into());
    }

    // Ensure signer exists and is approved
    if let Some(s) = ctx
        .db
        .user_signer()
        .signer_uuid()
        .find(&signer_uuid_trimmed)
    {
        if normalize_status(&s.status) != "approved" {
            return Err("signer is not approved".into());
        }
    } else {
        return Err("signer not found".into());
    }

    let row = ScheduledPost {
        id: id_trimmed.clone(),
        user_fid,
        signer_uuid: signer_uuid_trimmed,
        text,
        scheduled_time,
        channel_id,
        channel_name,
        channel_image,
        status: "pending".into(),
        cast_hash: None,
        error: None,
        posted_at: None,
    };

    match ctx.db.scheduled_post().try_insert(row) {
        Ok(inserted) => {
            spacetimedb::log::info!(
                "Created scheduled post id={} user_fid={} scheduled_time={} status={}",
                inserted.id,
                inserted.user_fid,
                inserted.scheduled_time,
                inserted.status
            );
            Ok(())
        }
        Err(e) => Err(format!("Failed to create scheduled post: {}", e)),
    }
}

// 4. Update an existing scheduled post
#[reducer]
pub fn update_scheduled_post(
    ctx: &ReducerContext,
    id: String,
    new_text: Option<String>,
    new_scheduled_time: Option<u64>,
    new_channel_id: Option<Option<String>>,
    new_channel_name: Option<Option<String>>,
    new_channel_image: Option<Option<String>>,
    new_status: Option<String>,
) -> Result<(), String> {
    let id_trimmed = id.trim().to_string();
    if id_trimmed.is_empty() {
        return Err("id must not be empty".into());
    }

    if let Some(mut post) = ctx.db.scheduled_post().id().find(&id_trimmed) {
        if let Some(t) = new_text {
            if t.trim().is_empty() {
                return Err("text must not be empty when updating".into());
            }
            post.text = t;
        }
        if let Some(ts) = new_scheduled_time {
            if ts == 0 {
                return Err("scheduled_time must be a valid unix timestamp (seconds)".into());
            }
            post.scheduled_time = ts;
        }
        if let Some(v) = new_channel_id {
            post.channel_id = v;
        }
        if let Some(v) = new_channel_name {
            post.channel_name = v;
        }
        if let Some(v) = new_channel_image {
            post.channel_image = v;
        }
        if let Some(s) = new_status {
            let s_norm = normalize_status(&s);
            if !is_valid_post_status(&s_norm) {
                return Err("invalid status; allowed: pending, posted, failed, skipped".into());
            }
            // Disallow transitioning directly to posted/failed via this generic updater
            if s_norm == "posted" || s_norm == "failed" {
                return Err("use mark_post_as_posted or mark_post_as_failed to set terminal statuses".into());
            }
            post.status = s_norm;
        }

        // For safety, clear cast_hash/error if status is set to pending or skipped
        if post.status == "pending" || post.status == "skipped" {
            post.cast_hash = None;
            post.error = None;
            post.posted_at = None;
        }

        // Store values for logging before move
        let log_id = post.id.clone();
        let log_status = post.status.clone();
        let log_time = post.scheduled_time;
        ctx.db.scheduled_post().id().update(post);
        spacetimedb::log::info!(
            "Updated scheduled post id={} status={} scheduled_time={}",
            log_id,
            log_status,
            log_time
        );
        Ok(())
    } else {
        Err("scheduled post not found".into())
    }
}

// 5. Delete a scheduled post
#[reducer]
pub fn delete_scheduled_post(ctx: &ReducerContext, id: String) -> Result<(), String> {
    let id_trimmed = id.trim().to_string();
    if id_trimmed.is_empty() {
        return Err("id must not be empty".into());
    }

    if ctx.db.scheduled_post().id().find(&id_trimmed).is_some() {
        ctx.db.scheduled_post().id().delete(&id_trimmed);
        spacetimedb::log::info!("Deleted scheduled post id={}", id_trimmed);
        Ok(())
    } else {
        Err("scheduled post not found".into())
    }
}

// 6. Get all scheduled posts for a user (no-op; clients should query the public table)
#[reducer]
pub fn get_user_scheduled_posts(_ctx: &ReducerContext, _user_fid: u64) -> Result<(), String> {
    // In SpacetimeDB, clients should directly read from/subscribe to the `scheduled_post` table
    // filtering by user_fid.
    Ok(())
}

// 7. Get all pending posts ready to be posted (no-op; clients should query with scheduled_time <= now)
#[reducer]
pub fn get_pending_posts(_ctx: &ReducerContext) -> Result<(), String> {
    // In SpacetimeDB, clients should query the `scheduled_post` table where:
    //   status = 'pending' AND scheduled_time <= now()
    Ok(())
}

// 8. Mark a post as posted with cast hash
#[reducer]
pub fn mark_post_as_posted(
    ctx: &ReducerContext,
    id: String,
    cast_hash: String,
    posted_at: Option<u64>,
) -> Result<(), String> {
    let id_trimmed = id.trim().to_string();
    if id_trimmed.is_empty() {
        return Err("id must not be empty".into());
    }
    if cast_hash.trim().is_empty() {
        return Err("cast_hash must not be empty".into());
    }

    if let Some(mut post) = ctx.db.scheduled_post().id().find(&id_trimmed) {
        // Only allow from pending or skipped to posted
        let current_status = normalize_status(&post.status);
        if current_status != "pending" && current_status != "skipped" {
            return Err(format!(
                "cannot mark post as posted from status '{}'",
                current_status
            ));
        }

        post.status = "posted".into();
        post.cast_hash = Some(cast_hash);
        post.error = None;
        post.posted_at = Some(posted_at.unwrap_or_else(|| now_unix_seconds(ctx)));

        // Store logging data before update (to avoid moved value)
        let log_id = post.id.clone();
        let log_posted_at = post.posted_at.unwrap_or_default();
        ctx.db.scheduled_post().id().update(post);
        spacetimedb::log::info!("Marked post id={} as posted at={}", log_id, log_posted_at);
        Ok(())
    } else {
        Err("scheduled post not found".into())
    }
}

// 9. Mark a post as failed with error message
#[reducer]
pub fn mark_post_as_failed(ctx: &ReducerContext, id: String, error: String) -> Result<(), String> {
    let id_trimmed = id.trim().to_string();
    if id_trimmed.is_empty() {
        return Err("id must not be empty".into());
    }
    if error.trim().is_empty() {
        return Err("error message must not be empty".into());
    }

    if let Some(mut post) = ctx.db.scheduled_post().id().find(&id_trimmed) {
        // Allow failing from any non-terminal state; prevent overwriting posted
        let current_status = normalize_status(&post.status);
        if current_status == "posted" {
            return Err("cannot mark a posted cast as failed".into());
        }

        post.status = "failed".into();
        post.error = Some(error);
        post.posted_at = None;

        let log_id = post.id.clone();
        ctx.db.scheduled_post().id().update(post);
        spacetimedb::log::info!("Marked post id={} as failed", log_id);
        Ok(())
    } else {
        Err("scheduled post not found".into())
    }
}