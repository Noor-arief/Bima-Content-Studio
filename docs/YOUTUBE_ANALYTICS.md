# YouTube Shorts analytics

Channel: `UCTm_pCLEBWcENGFL4KH4-9w` (Orbit & Ocean).

Menu: YouTube → Analytics YouTube. Read-only owner route: `GET /api/youtube/analytics?days=7|28|90`.

Reports use YouTube's `creatorContentType=SHORTS` rows, not a duration heuristic. Metrics include views, engaged views, watch time, average view duration/percentage, likes, comments, shares and subscribers gained/lost. Video metrics cover the selected period, not lifetime. The table selects Shorts from up to 200 top channel videos and explicitly marks truncation. Empty reports remain empty, not fabricated zero totals. Reporting days use Pacific time and exclude today's incomplete day; API processing may delay results further.

Owner Google consent is required via `/auth/google/start?analytics=1`. This adds `yt-analytics.readonly` to the existing publishing/read-only scopes. Ordinary publishing sign-in is preserved. Enable YouTube Analytics API in the existing Google Cloud project and add the read-only analytics scope to the OAuth consent configuration if needed. Reconnect as the channel owner from the Analytics panel. No credentials should be pasted into the dashboard or committed.

Private data stays behind the existing owner session and exact channel lock, with a five-minute in-memory cache. Reports/tokens are not put in public status, localStorage or GitHub. The public health endpoint only indicates `analyticsAvailable: true` to identify a backend release with this feature.

Validation: module tests cover channel mismatch, Shorts isolation, empty data, Pacific date ranges, safe permission errors. Server smoke test checks unauthenticated denial and disconnected channel denial. Frontend browser checks cover signed-out state, mocked report rendering, safe title rendering, mobile layout and channel navigation. Mocked reports do not prove live Google access.

Rollout: Google owner consent and a successful real report must be verified after backend deployment. Revenue, realtime metrics, Studio impressions/CTR and retention curves are not included in this version.

Sources:
- https://developers.google.com/youtube/analytics/channel_reports
- https://developers.google.com/youtube/analytics/reference/reports/query
- https://developers.google.com/youtube/analytics/dimensions
