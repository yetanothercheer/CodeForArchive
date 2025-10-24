import puppeteer from 'puppeteer';
import * as cheerio from 'cheerio'; 

// --- CONFIGURATION ---
/**
 * Set to 'TEST' to limit crawl to top 5 titles, and commit to 'staging' branch (Default).
 * Set to 'PROD' to crawl all available titles, and commit to 'main' branch.
 * Reads environment from process.env.WEIBO_ENV, defaulting to 'TEST'.
 * NOTE: Both environments now run without a proxy and in non-headless mode.
 */
const ENVIRONMENT = process.env.WEIBO_ENV || 'TEST';
// ---------------------


// --- GITHUB CONFIGURATION ---
const BOT = {
    name: "yetanother-archivebot[bot]",
    email: "90119549+yetanother-archivebot[bot]@users.noreply.github.com",
};
const OWNER = "yetanothercheer";
const REPO = "Archive";
const VERSION = "wb.beta";
const MAIN_BRANCH = "main";
const STAGING_BRANCH = "staging";

/**
 * Retrieves the GitHub token from the environment variable.
 * @returns {string | null} The token or null if not set.
 */
function getToken() {
    const token = process.env.MY_GITHUB_TOKEN;
    if (!token) {
        console.error("! MY_GITHUB_TOKEN is not set. Skipping GitHub commit.");
    }
    return token;
}

/**
 * Calculates time, commit message, and file path based on UTC+08:00.
 *
 * NOTE: This function has been simplified to use native JS Date objects 
 * for cleaner UTC+8 calculation and formatting.
 * * @returns {{year: number, month: string, ISO_TIME: string, MESSAGE: string, TIME_STRING: string}} Time and message data.
 */
function getGitHubTimeData() {
    // 1. Calculate the time in UTC+8 by adding the offset (8 hours in milliseconds)
    const utc8OffsetMs = 8 * 60 * 60 * 1000;
    const now = new Date(); // Current UTC time (based on system clock)
    const now_utc8 = new Date(now.getTime() + utc8OffsetMs); 

    // Helper to pad numbers
    const pad = (num) => String(num).padStart(2, '0');

    // 2. Format TIME_STRING: YYYY/MM/DD HH:MM UTC+08:00
    const TIME_STRING = `${now_utc8.getFullYear()}/${
        pad(now_utc8.getMonth() + 1)}/${
        pad(now_utc8.getDate())} ${
        pad(now_utc8.getHours())}:${
        pad(now_utc8.getMinutes())} UTC+08:00`;

    const MESSAGE = `记录于 ${TIME_STRING}`;

    // 3. Format ISO_TIME for path: YYYY-MM-DDTHH:MM:SS.sss+08:00
    // Use the ISO string from the offset date and replace the 'Z' (Zulu/UTC) with '+08:00'
    const ISO_TIME_PATH = now_utc8.toISOString().replace('Z', '+08:00');
    
    // 4. Extract Year and Month (from the UTC+8 components) for the PATH structure
    const year = now_utc8.getFullYear();
    const month = pad(now_utc8.getMonth() + 1);

    return { 
        year, 
        month, 
        ISO_TIME: ISO_TIME_PATH, 
        MESSAGE,
        TIME_STRING 
    };
}

/**
 * Determines the target branch, file path, and commit message.
 * @param {'TEST' | 'PROD'} environment Current environment setting.
 * @returns {{branch: string, PATH: string, MESSAGE: string, TIME_STRING: string}} Commit details.
 */
function getGitHubInfo(environment) {
    // Captures TIME_STRING for use in the JSON wrapper
    const { year, month, ISO_TIME, MESSAGE, TIME_STRING } = getGitHubTimeData(); 
    
    // TEST -> staging, PROD -> main
    const branch = environment === 'TEST' ? STAGING_BRANCH : MAIN_BRANCH;
    
    // PATH format: {year}.{month:0>2}.{VERSION}/{ISO_TIME}.json
    const PATH = `${year}.${month}.${VERSION}/${ISO_TIME}.json`;
    
    return { branch, PATH, MESSAGE, TIME_STRING }; // <-- Passing TIME_STRING
}

/**
 * Uploads the file content as a new file to the specified branch on GitHub.
 * @param {string} filePath The full path for the new file.
 * @param {string} fileContent The UTF-8 string content of the file (JSON).
 * @param {string} branch The target branch name ('main' or 'staging').
 * @param {string} commitMessage The message for the commit.
 */
async function commitToGitHub(filePath, fileContent, branch, commitMessage) {
    const token = getToken();
    if (!token) return;

    console.log(`\n--- Committing data to GitHub (${branch} branch) ---`);
    console.log(`\tTarget file path: ${filePath}`);

    const API_BASE = `https://api.github.com/repos/${OWNER}/${REPO}`;
    const headers = {
        'Authorization': `token ${token}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': BOT.name
    };

    try {
        // 1. Get the latest commit SHA of the branch
        let response = await fetch(`${API_BASE}/git/refs/heads/${branch}`, { headers });
        let data = await response.json();
        // Exponential backoff logic would be added here in a robust implementation, 
        // but for a single fetch, we check for error status.
        if (!response.ok) throw new Error(`Failed to get ref: ${data.message || response.statusText}`);
        const baseCommitSha = data.object.sha;

        // 2. Create a Blob with the file content (UTF-8 encoded Base64)
        // Using Buffer is necessary in Node.js environments for Base64 encoding
        const contentBase64 = Buffer.from(fileContent, 'utf8').toString('base64');
        
        response = await fetch(`${API_BASE}/git/blobs`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                content: contentBase64,
                encoding: 'base64',
            }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(`Failed to create blob: ${data.message || response.statusText}`);
        const blobSha = data.sha;

        // 3. Create a Tree object (associates file path with blob SHA)
        response = await fetch(`${API_BASE}/git/trees`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                base_tree: baseCommitSha,
                tree: [{
                    path: filePath,
                    mode: '100644', 
                    type: 'blob',
                    sha: blobSha,
                }],
            }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(`Failed to create tree: ${data.message || response.statusText}`);
        const newTreeSha = data.sha;

        // 4. Create a Commit object
        response = await fetch(`${API_BASE}/git/commits`, {
            method: 'POST',
            headers,
            body: JSON.stringify({
                message: commitMessage,
                tree: newTreeSha,
                parents: [baseCommitSha],
                author: BOT, 
                committer: BOT, 
            }),
        });
        data = await response.json();
        if (!response.ok) throw new Error(`Failed to create commit: ${data.message || response.statusText}`);
        const newCommitSha = data.sha;

        // 5. Update the Branch Reference
        response = await fetch(`${API_BASE}/git/refs/heads/${branch}`, {
            method: 'PATCH',
            headers,
            body: JSON.stringify({
                sha: newCommitSha,
                force: false, 
            }),
        });
        
        if (!response.ok) {
            data = await response.json();
            throw new Error(`Failed to update branch ref: ${data.message || response.statusText}`);
        }
        
        // Use the commit SHA to construct a readable URL for logging
        const commitUrl = `https://github.com/${OWNER}/${REPO}/commit/${newCommitSha}`;
        console.log(`\n✅ Successfully committed data to branch '${branch}' as '${filePath}'`);
        console.log(`   Commit URL: ${commitUrl}`);

    } catch (error) {
        console.error(`\n❌ GITHUB COMMIT FAILED. Details: ${error.message}`);
    }
}
// --- END GITHUB CONFIGURATION ---


// --- Helper Function ---
/**
 * Strips HTML tags from a string of text using a robust parser (Cheerio).
 * @param {string} html The raw HTML string.
 * @returns {string} The plain text content.
 */
const extract_text_from_html = (html) => {
    if (!html) return '';
    const $ = cheerio.load(html);
    return $.text().trim();
};

// --- Browser Class (Manages Puppeteer lifecycle) ---
class Browser {
    constructor() {
        this.browser = null;
        this.page = null;
    }

    /**
     * Launches the Puppeteer browser and sets up a new page.
     */
    async start() {
        console.log("Starting browser...");
        try {
            const launchArgs = [
                `--window-size=540,960`,
                `--ignore-certificate-errors` 
            ];
            
            // Per request: No proxy for any environment.
            console.log("No proxy will be used for any environment.");

            this.browser = await puppeteer.launch({
                headless: true, // Per request: Non-headless mode for all environments
                defaultViewport: { width: 540, height: 960 },
                args: launchArgs,
            });
            this.page = await this.browser.newPage();
            this.page.setDefaultTimeout(30000); 
            console.log(`Browser started. Environment: ${ENVIRONMENT}. Headless: false. Certificate errors will be ignored.`);
        } catch (error) {
            console.error("CRITICAL: Error launching browser:", error.message);
            throw new Error("Failed to initialize Puppeteer browser.");
        }
    }

    /**
     * Performs an HTTP GET request using the Puppeteer page.
     * @param {string} url The URL to crawl.
     * @returns {Promise<{status: number, content: string | null}>} The response status and body content.
     */
    async crawler_page(url) {
        if (!this.page) {
            throw new Error("Browser page is not initialized. Call start() first.");
        }
        // Removed: console.log(`\nCrawling URL: ${url}`);
        try {
            const response = await this.page.goto(url, { waitUntil: 'networkidle0' });

            const status = response.status();
            // CHANGE: Only log response status if it is not 200
            if (status !== 200) { 
                console.log(`Response Status: ${status}`);
            }

            const content = await response.text();

            return { status, content };
        } catch (error) {
            console.error(`Error during page crawl for ${url}: ${error.message}`);
            return { status: 500, content: null };
        }
    }

    /**
     * Closes the browser instance.
     */
    async close() {
        if (this.browser) {
            await this.browser.close();
            console.log("Browser closed.");
        }
    }
}

// --- Weibo Class (Handles API logic) ---
class Weibo {
    url_main_realtime = "https://m.weibo.cn/api/container/getIndex?containerid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&title=%E5%BE%8E%E5%8D%9A%E7%83%AD%E6%90%9C&extparam=seat%3D1%26pos%3D0_0%26dgr%3D0%26mi_cid%3D100103%26cate%3D10103%26filter_type%3Drealtimehot%26c_type%3D30%26display_time%3D1642858758%26pre_seqid=234361947&luicode=10000011&lfid=231583";
    
    // Encodes the title parameter for safety
    url_hot = title => 
        `https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D60%26q%3D%23${encodeURIComponent(title)}%23%26t%3D10&isnewpage=1&extparam=seat%3D1%26filter_type%3Drealtimehot%26dgr%3D0%26cate%3D0%26pos%3D1%26realpos%3D2%26flag%3D2%26c_type%3D31%26display_time%3D1642858915%26pre_seqid=1642858915014031711308&luicode=10000011&lfid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&page_type=searchall`;
    
    // Encodes the title parameter for safety
    url_realtime = title =>
        `https://m.weibo.cn/api/container/getIndex?containerid=100103type%3D61%26q%3D%23${encodeURIComponent(title)}%23%26t%3D10&isnewpage=1&extparam=seat%3D1%26filter_type%3Drealtimehot%26dgr%3D0%26cate%3D0%26pos%3D1%26realpos%3D2%26flag%3D2%26c_type%3D31%26display_time%3D1642858915%26pre_seqid=1642858915014031711308&luicode=10000011&lfid=106003type%3D25%26t%3D3%26disable_hot%3D1%26filter_type%3Drealtimehot&page_type=searchall`;
    
    url_comments = (id, mid) => 
        `https://m.weibo.cn/comments/hotflow?id=${id}&mid=${mid}&max_id_type=0`;

    constructor(browser) {
        this.browser = browser;
    }

    /**
     * Core method for fetching, parsing, and enhancing Weibo data from an API endpoint.
     * @param {string} url The Weibo API URL to fetch.
     * @param {string} title The search title (used for logging context).
     * @returns {Promise<Array<Object>>} List of enhanced mblog objects.
     */
    async get_under(url, title) {
        const response = await this.browser.crawler_page(url);

        if (response.status !== 200 || !response.content) {
            console.error(`ERROR: Failed to fetch data for title "${title}". Status: ${response.status}`);
            return [];
        }

        let data;
        try {
            data = JSON.parse(response.content);
        } catch (e) {
            console.error(`ERROR: Failed to parse JSON for title "${title}".`, e);
            return [];
        }
        
        const top_cards = data.data?.cards;
        if (!top_cards) {
            console.warn(`WARN: Data structure missing 'data.cards' for title "${title}".`);
            return [];
        }

        let cards = top_cards.filter(c => c.card_type === 9); // Type 9: main mblog posts

        // Process card_groups (type 11) to find more type 9 mblogs
        const card_groups = top_cards.filter(c => c.card_type === 11);

        // Iterating backwards and prepending new cards 
        for (const card_group of [...card_groups].reverse()) {
            const new_cards = card_group.card_group
                ? card_group.card_group.filter(c => c.card_type === 9)
                : [];
            cards = new_cards.concat(cards); 
        }

        // Extract core information and flatten structure
        let mblogsInfo = cards.map(c => {
            const m = c.mblog;
            if (!m || !m.user) return null; // Skip invalid entries

            return {
                text: extract_text_from_html(m.text),
                attitudes_count: m.attitudes_count,
                comments_count: m.comments_count,
                reposts_count: m.reposts_count,
                created_at: m.created_at,
                // These are included here but will be removed using destructuring later
                isLongText: m.isLongText || false,
                id: m.id,
                mid: m.mid,
                user: m.user.screen_name,
                pic_ids: m.pic_ids,
            };
        }).filter(Boolean);
        
        // --- LOGGING ---
        const totalMblogsCount = mblogsInfo.length;
        console.log(`\tFound ${totalMblogsCount} mblogs to process.`);
        // --- END LOGGING ---

        // Process Long Text and Fetch Comments
        const finalMblogs = [];
        for (let idx = 0; idx < totalMblogsCount; idx++) {
            const mblog = mblogsInfo[idx];
            const progressHint = `(${idx + 1}/${totalMblogsCount})`;

            // Use destructuring to extract temporary IDs/flags (id, mid, isLongText) 
            const { id, mid, isLongText, ...postData } = mblog;
            
            // 1. Handle Long Text
            if (isLongText) {
                const extendUrl = `https://m.weibo.cn/statuses/extend?id=${id}`;
                const result = await this.browser.crawler_page(extendUrl);

                if (result.status === 200 && result.content) {
                    try {
                        const longTextResponse = JSON.parse(result.content);
                        postData.text = extract_text_from_html(longTextResponse.data?.longTextContent);
                        // Removed: success log for long text fetch
                    } catch (e) {
                        console.error(`\tERROR: Failed to parse long text for ID ${id}.`, e.message);
                    }
                } else {
                    console.error(`\tERROR: Failed to fetch long text for ID ${id}. Status: ${result.status}`);
                }
            }
            
            // Refocused Logging: Concise post summary (MOVED UP)
            if (postData.user && postData.text) { 
                const logUser = postData.user.length > 12 ? postData.user.substring(0, 12) + '...' : postData.user;
                const logText = postData.text.length > 20 ? postData.text.substring(0, 20) + '...' : postData.text;
                
                console.log(`\t${progressHint} - Post by [${logUser}]: "${logText}" (👍${postData.attitudes_count} 💬${postData.comments_count} 🔁${postData.reposts_count})`);
            }


            // 2. Fetch Comments
            if (postData.comments_count > 0) {
                const commentsUrl = this.url_comments(id, mid);
                const result = await this.browser.crawler_page(commentsUrl);
                
                let retrievedCount = 0;

                if (result.status === 200 && result.content) {
                    try {
                        const commentsResponse = JSON.parse(result.content);
                        
                        // Check for valid data structure (data and data.data exist and are not null/undefined)
                        if (commentsResponse.data && commentsResponse.data.data) {
                            const comments = commentsResponse.data.data.map(c => ({
                                like_count: c.like_count,
                                text: extract_text_from_html(c.text),
                                user: c.user.screen_name,
                            }));
                            postData.comments = comments; 
                            retrievedCount = comments.length;
                        } 
                    } catch (e) {
                        console.error(`\tERROR: Failed to parse comments for ID ${id}.`, e.message);
                    }
                } else {
                    console.error(`\tERROR: Failed to fetch comments for ID ${id}. Status: ${result.status}`);
                }
                
                // Consolidated Logging for Comments Retrieval
                // Logs success if > 0 comments retrieved, or a warning if 0 comments retrieved when > 0 was expected
                if (retrievedCount > 0) {
                    console.log(`\t${progressHint} - Retrieved ${retrievedCount} hot comments for post ID ${id}.`);
                } else if (postData.comments_count > 0) {
                    // This handles cases where API fetch succeeded (200) but returned an empty array or missing data structure.
                    // This is the specific zero-comments-after-200-response log requested.
                    console.log(`\t${progressHint} - WARNING: Expected comments (Count: ${postData.comments_count}) for post ID ${id}, but retrieved 0 hot comments.`);
                }
            }


            finalMblogs.push(postData); // Push the final, clean object
        }

        if (finalMblogs.length === 0) {
            console.warn(`WARN: Zero mblogs found for topic "${title}".`);
        }
        
        // LOGGING: Always output the total number processed
        console.log(`\tTotal mblogs processed for topic "${title}": ${finalMblogs.length}.`);

        return finalMblogs;
    }


    /**
     * Fetches details for a specific title from hot and realtime endpoints using get_under.
     */
    async get_title(title) {
        console.log(`\tFetching 'hot' data for title: ${title}`);
        const hot = await this.get_under(this.url_hot(title), title);
        
        console.log(`\tFetching 'realtime' data for title: ${title}`);
        const realtime = await this.get_under(this.url_realtime(title), title);
        
        return { title, hot, realtime };
    }

    /**
     * Fetches the main realtime hot search list and parses titles.
     */
    async get_main_realtime() {
        console.log("Fetching top hot search list...");
        try {
            const { status, content } = await this.browser.crawler_page(this.url_main_realtime);

            if (status !== 200 || !content) {
                console.error(`ERROR: Failed to fetch main realtime. HTTP Status: ${status}`);
                return [];
            }

            const data = JSON.parse(content);

            const titles = data.data?.cards?.[0]?.card_group
                ?.map(item => item.desc) 
                .filter(Boolean) || [];

            console.log(`\tParsed ${titles.length} hot search titles.`);
            return titles;

        } catch (error) {
            console.error("ERROR: Failed to parse content in get_main_realtime:", error.message);
            return [];
        }
    }

    /**
     * Main execution loop: fetches titles and then fetches details for each.
     */
    async main() {
        console.log("\n--- Starting Weibo Data Gathering Process ---");
        try {
            const titles = await this.get_main_realtime();
            
            if (titles.length === 0) {
                console.log("No hot search titles found. Aborting main process.");
                return;
            }

            // Apply TEST/PROD logic for title subset
            const titlesToProcess = (ENVIRONMENT === 'TEST') 
                ? titles.slice(0, 5) // Test mode: only top 5
                : titles;           // Prod mode: all titles

            console.log(`\nProcessing ${titlesToProcess.length} titles in ${ENVIRONMENT} mode.`);

            const allCrawledData = [];

            for (const title of titlesToProcess) {
                console.log(`\n--- Processing Title: "${title}" ---`);
                const details = await this.get_title(title);
                allCrawledData.push(details);
            }
            
            // Get GitHub commit details, including the TIME_STRING needed for the JSON wrapper
            const { branch, PATH, MESSAGE, TIME_STRING } = getGitHubInfo(ENVIRONMENT);
            
            // 1. Construct the final data object with the requested wrapper
            const finalDataWrapper = {
                archiveTime: TIME_STRING,
                archive: allCrawledData
            };

            // 2. Generate the final JSON string (unicode preserved)
            const finalJsonString = JSON.stringify(finalDataWrapper, null, 2);

            // Dump final data to GitHub
            await commitToGitHub(PATH, finalJsonString, branch, MESSAGE);

            console.log("\n--- Weibo Data Gathering Process Finished ---");

        } catch (error) {
            console.error("\nCRITICAL ERROR in Weibo main process loop:", error.message);
        }
    }
}

// --- Main Execution Block ---

/**
 * Main execution function to orchestrate the crawler and handle resource cleanup.
 */
async function runCrawler() {
    // Instantiate the browser manager
    const browser = new Browser();
    try {
        // 1. Start the browser
        await browser.start();
        
        // 2. Initialize the Weibo logic with the active browser instance
        const weiboCrawler = new Weibo(browser);
        
        // 3. Run the main crawling logic
        await weiboCrawler.main();
    } catch (error) {
        // Catch any fatal error (e.g., browser failed to launch)
        console.error("\nFATAL ERROR: Crawler failed to execute:", error.message);
    } finally {
        // 4. Ensure the browser is closed, regardless of success or failure
        await browser.close();
    }
}

// Execute the async main function
runCrawler();
