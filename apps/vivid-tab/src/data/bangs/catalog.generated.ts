/**
 * GENERATED FILE — DO NOT EDIT.
 * Refresh with: bun run bangs:refresh
 * Source: Kagi Bangs (MIT, Copyright (c) 2024 Kagi Search)
 * Repository: https://github.com/kagisearch/bangs
 * Data: https://raw.githubusercontent.com/kagisearch/bangs/main/data/bangs.json
 * Source SHA-256: 9831c39b724021875192137674b2d95d0c392eb29204d0f982f67a0559647e82
 */
// biome-ignore format: Keep generated source deterministic.
export const BANGS = [
	{
		"domain": "www.amazon.com",
		"name": "Amazon.com",
		"template": "https://www.amazon.com/s?k={{{s}}}",
		"triggers": [
			"a",
			"amazon",
			"amus",
			"amz",
			"aus",
			"az",
			"buy",
			"price"
		]
	},
	{
		"domain": "www.aliexpress.com",
		"name": "AliExpress",
		"template": "https://www.aliexpress.com/wholesale?SearchText={{{s}}}",
		"triggers": [
			"ae",
			"ali",
			"aliexp",
			"aliexpress"
		]
	},
	{
		"domain": "www.airbnb.com",
		"name": "airbnb",
		"template": "https://www.airbnb.com/s/{{{s}}}",
		"triggers": [
			"airbnb"
		]
	},
	{
		"domain": "apnews.com",
		"name": "AP News",
		"template": "https://apnews.com/search?q={{{s}}}",
		"triggers": [
			"ap",
			"apnews"
		]
	},
	{
		"domain": "apps.apple.com",
		"name": "App Store (iPhone)",
		"template": "https://apps.apple.com/iphone/search?term={{{s}}}",
		"triggers": [
			"appstore",
			"iphoneapps",
			"iosapps",
			"iapp",
			"ipa"
		]
	},
	{
		"domain": "archive.org",
		"name": "Internet",
		"template": "https://archive.org/search.php?query={{{s}}}",
		"triggers": [
			"archive"
		]
	},
	{
		"domain": "web.archive.org",
		"format": [
			"open_base_path"
		],
		"name": "Wayback Machine",
		"template": "https://web.archive.org/web/*/{{{s}}}",
		"triggers": [
			"archived",
			"archiveweb",
			"ia",
			"wayback",
			"waybackmachine",
			"wbm",
			"webarchive"
		]
	},
	{
		"domain": "arxiv.org",
		"name": "arXiv.org",
		"template": "https://arxiv.org/search?query={{{s}}}&searchtype=all",
		"triggers": [
			"arx",
			"arxiv"
		]
	},
	{
		"domain": "bing.com",
		"name": "Bing",
		"template": "https://bing.com/search?q={{{s}}}",
		"triggers": [
			"b",
			"bing"
		]
	},
	{
		"domain": "www.bbc.co.uk",
		"name": "BBC.co.uk",
		"template": "https://www.bbc.co.uk/search/?q={{{s}}}",
		"triggers": [
			"bbc"
		]
	},
	{
		"domain": "www.booking.com",
		"name": "Booking.com",
		"template": "https://www.booking.com/searchresults.html?ss={{{s}}}&si=ai",
		"triggers": [
			"book",
			"booking"
		]
	},
	{
		"domain": "search.brave.com",
		"name": "Brave Search",
		"template": "https://search.brave.com/search?q={{{s}}}",
		"triggers": [
			"brave"
		]
	},
	{
		"domain": "crates.io",
		"name": "Cargo",
		"template": "https://crates.io/search?q={{{s}}}",
		"triggers": [
			"cargo",
			"crates"
		]
	},
	{
		"domain": "chatgpt.com",
		"icon": "assets/openai.png",
		"name": "ChatGPT",
		"template": "https://chatgpt.com/?prompt={{{s}}}",
		"triggers": [
			"chatgpt",
			"cgpt"
		]
	},
	{
		"domain": "claude.ai",
		"icon": "assets/claude.png",
		"name": "Claude",
		"template": "https://claude.ai/new?q={{{s}}}",
		"triggers": [
			"claude"
		]
	},
	{
		"domain": "www.cnn.com",
		"name": "CNN",
		"template": "https://www.cnn.com/search/?q={{{s}}}",
		"triggers": [
			"cnn"
		]
	},
	{
		"domain": "duckduckgo.com",
		"name": "DuckDuckGo",
		"template": "https://duckduckgo.com/?q={{{s}}}",
		"triggers": [
			"dax",
			"ddg",
			"duckduckgo"
		]
	},
	{
		"domain": "dev.to",
		"name": "dev.to",
		"template": "https://dev.to/search?q={{{s}}}",
		"triggers": [
			"dev.to",
			"devto"
		]
	},
	{
		"domain": "www.dict.org",
		"name": "Dict.org",
		"template": "https://www.dict.org/bin/Dict?Form=Dict2&Database=*&Query={{{s}}}",
		"triggers": [
			"dict"
		]
	},
	{
		"domain": "search.disney.go.com",
		"name": "Disney.com",
		"template": "https://search.disney.go.com/?q={{{s}}}",
		"triggers": [
			"disney"
		]
	},
	{
		"domain": "hub.docker.com",
		"name": "Docker Hub",
		"template": "https://hub.docker.com/search?q={{{s}}}",
		"triggers": [
			"docker",
			"dhub",
			"dockerhub",
			"dh"
		]
	},
	{
		"domain": "docs.rs",
		"name": "Docs.rs",
		"template": "https://docs.rs/releases/search?query={{{s}}}",
		"triggers": [
			"docsrs",
			"docs.rs"
		]
	},
	{
		"domain": "drive.google.com",
		"icon": "assets/drive.png",
		"name": "Google Drive",
		"template": "https://drive.google.com/drive/search?q={{{s}}}",
		"triggers": [
			"drive",
			"gdrive"
		]
	},
	{
		"domain": "www.ebay.com",
		"name": "eBay",
		"template": "https://www.ebay.com/sch/items/?_nkw={{{s}}}",
		"triggers": [
			"ebay",
			"eb",
			"e"
		]
	},
	{
		"domain": "www.epicgames.com",
		"name": "Epic Games",
		"template": "https://www.epicgames.com/bing-search?keyword={{{s}}}",
		"triggers": [
			"epic"
		]
	},
	{
		"domain": "www.etsy.com",
		"name": "Etsy",
		"template": "https://www.etsy.com/search?q={{{s}}}",
		"triggers": [
			"etsy"
		]
	},
	{
		"domain": "www.facebook.com",
		"name": "Facebook",
		"template": "https://www.facebook.com/s.php?q={{{s}}}",
		"triggers": [
			"facebook",
			"fb",
			"fbk"
		]
	},
	{
		"domain": "www.google.com",
		"name": "Google",
		"template": "https://www.google.com/search?q={{{s}}}",
		"triggers": [
			"g",
			"google",
			"goog"
		]
	},
	{
		"domain": "calendar.google.com",
		"name": "Google Calendar",
		"template": "https://calendar.google.com/calendar/b/0/r/search?q={{{s}}}",
		"triggers": [
			"gcal",
			"calendar"
		]
	},
	{
		"domain": "genius.com",
		"name": "Genius",
		"template": "https://genius.com/search?q={{{s}}}",
		"triggers": [
			"gen",
			"genius",
			"rap",
			"rg"
		]
	},
	{
		"domain": "github.com",
		"name": "GitHub",
		"template": "https://github.com/search?q={{{s}}}",
		"triggers": [
			"gh",
			"git",
			"github"
		]
	},
	{
		"domain": "google.com",
		"name": "Google Images",
		"template": "https://google.com/search?tbm=isch&q={{{s}}}&tbs=imgo:1",
		"triggers": [
			"gi",
			"gimages",
			"gim",
			"googleimages",
			"googleimg",
			"gimg"
		]
	},
	{
		"domain": "gitlab.com",
		"name": "GitLab",
		"template": "https://gitlab.com/search?utf8=%E2%9C%93&search={{{s}}}",
		"triggers": [
			"glab",
			"gitlab"
		]
	},
	{
		"domain": "mail.google.com",
		"icon": "assets/gmail.png",
		"name": "GMail.com",
		"template": "https://mail.google.com/mail/#search/{{{s}}}",
		"triggers": [
			"gmail"
		]
	},
	{
		"domain": "maps.google.com",
		"name": "Google Maps",
		"template": "https://maps.google.com/maps?q={{{s}}}",
		"triggers": [
			"gmap",
			"gmaps",
			"gm",
			"googlemap",
			"googlemaps"
		]
	},
	{
		"domain": "news.google.com",
		"name": "Google News",
		"template": "https://news.google.com/search?q={{{s}}}",
		"triggers": [
			"gnews",
			"gnus",
			"gn"
		]
	},
	{
		"domain": "www.goodreads.com",
		"name": "Goodreads",
		"template": "https://www.goodreads.com/search?q={{{s}}}",
		"triggers": [
			"gr"
		]
	},
	{
		"domain": "scholar.google.com",
		"name": "Google Scholar",
		"template": "https://scholar.google.com/scholar?&q={{{s}}}",
		"triggers": [
			"gsch",
			"gsc",
			"gscholar",
			"scholar",
			"gschol",
			"papers",
			"googlescholar"
		]
	},
	{
		"domain": "www.google.com",
		"name": "Google Shopping",
		"template": "https://www.google.com/search?q={{{s}}}&udm=28",
		"triggers": [
			"gs",
			"gshopping",
			"shopping"
		]
	},
	{
		"domain": "translate.google.com",
		"name": "Google Translate (to English)",
		"template": "https://translate.google.com/#auto/en/{{{s}}}",
		"triggers": [
			"gten",
			"gt-english",
			"gtenglish",
			"gt",
			"gtranslate"
		]
	},
	{
		"domain": "hn.algolia.com",
		"format": [
			"open_snap_domain",
			"url_encode_placeholder",
			"url_encode_space_to_plus"
		],
		"name": "Hacker News",
		"snapDomain": "news.ycombinator.com",
		"template": "https://hn.algolia.com/?q={{{s}}}",
		"triggers": [
			"hn",
			"newsyc",
			"searchyc",
			"hnsearch",
			"hackernews"
		]
	},
	{
		"domain": "www.hulu.com",
		"name": "Hulu",
		"template": "https://www.hulu.com/search?query={{{s}}}",
		"triggers": [
			"hulu"
		]
	},
	{
		"domain": "www.instagram.com",
		"name": "Instagram",
		"template": "https://www.instagram.com/explore/tags/{{{s}}}/",
		"triggers": [
			"ig",
			"igu",
			"instagram",
			"insta"
		]
	},
	{
		"domain": "www.imdb.com",
		"name": "IMDB",
		"template": "https://www.imdb.com/find?s=all&q={{{s}}}",
		"triggers": [
			"imdb"
		]
	},
	{
		"domain": "developer.mozilla.org",
		"name": "MDN Web Docs",
		"template": "https://developer.mozilla.org/search?q={{{s}}}",
		"triggers": [
			"javascript",
			"mdc",
			"mdn"
		]
	},
	{
		"domain": "letterboxd.com",
		"name": "Letterboxd",
		"template": "https://letterboxd.com/search/{{{s}}}",
		"triggers": [
			"lbx",
			"lb",
			"ltr",
			"letterboxd"
		]
	},
	{
		"domain": "www.linkedin.com",
		"icon": "assets/linkedin.png",
		"name": "LinkedIn",
		"template": "https://www.linkedin.com/search/results/all/?keywords={{{s}}}",
		"triggers": [
			"li",
			"linkedin"
		]
	},
	{
		"domain": "thesaurus.com",
		"name": "Thesaurus.com",
		"template": "https://thesaurus.com/browse/{{{s}}}",
		"triggers": [
			"like",
			"synonyms",
			"syn",
			"synonym",
			"thes",
			"tref",
			"t",
			"thesaurus"
		]
	},
	{
		"domain": "musicbrainz.org",
		"name": "MusicBrainz (artist)",
		"template": "https://musicbrainz.org/search/textsearch.html?type=artist&query={{{s}}}&handlearguments=1",
		"triggers": [
			"mb",
			"musicbrainz"
		]
	},
	{
		"domain": "medium.com",
		"name": "Medium",
		"template": "https://medium.com/search?q={{{s}}}",
		"triggers": [
			"medium",
			"med"
		]
	},
	{
		"domain": "www.netflix.com",
		"name": "Netflix",
		"template": "https://www.netflix.com/search?q={{{s}}}",
		"triggers": [
			"netflix",
			"net",
			"nf"
		]
	},
	{
		"domain": "www.npmjs.com",
		"name": "npm",
		"template": "https://www.npmjs.com/search?q={{{s}}}",
		"triggers": [
			"npmjs",
			"npm"
		]
	},
	{
		"domain": "www.openstreetmap.org",
		"name": "OpenStreetMap",
		"template": "https://www.openstreetmap.org/search?query={{{s}}}",
		"triggers": [
			"osm",
			"openstreetmap",
			"openstreet",
			"openmaps",
			"omap",
			"ost"
		]
	},
	{
		"domain": "stackoverflow.com",
		"name": "StackOverflow",
		"template": "https://stackoverflow.com/search?q={{{s}}}",
		"triggers": [
			"ov",
			"sof",
			"so",
			"stackoverflow",
			"stack"
		]
	},
	{
		"domain": "perplexity.ai",
		"name": "Perplexity AI",
		"template": "https://perplexity.ai/?q={{{s}}}",
		"triggers": [
			"perplexity",
			"ppx",
			"pplx"
		]
	},
	{
		"domain": "www.ncbi.nlm.nih.gov",
		"name": "Pubmed",
		"template": "https://www.ncbi.nlm.nih.gov/pubmed/?term={{{s}}}",
		"triggers": [
			"pmd",
			"pmid",
			"pm",
			"pubmed",
			"pub"
		]
	},
	{
		"domain": "pypi.org",
		"name": "PyPI",
		"template": "https://pypi.org/search/?q={{{s}}}",
		"triggers": [
			"pypi",
			"pip",
			"pypa"
		]
	},
	{
		"domain": "www.reddit.com",
		"name": "Reddit",
		"template": "https://www.reddit.com/search?q={{{s}}}",
		"triggers": [
			"reddit",
			"r"
		]
	},
	{
		"domain": "www.reuters.com",
		"name": "Reuters",
		"template": "https://www.reuters.com/site-search/?query={{{s}}}",
		"triggers": [
			"reuq",
			"reuters"
		]
	},
	{
		"domain": "www.rottentomatoes.com",
		"name": "Rotten Tomatoes",
		"template": "https://www.rottentomatoes.com/search/?search={{{s}}}",
		"triggers": [
			"rottentomatoes",
			"rottentomato",
			"rt"
		]
	},
	{
		"domain": "soundcloud.com",
		"name": "SoundCloud",
		"template": "https://soundcloud.com/search?q={{{s}}}",
		"triggers": [
			"scloud",
			"sc",
			"sndcld",
			"soundcloud",
			"sound"
		]
	},
	{
		"domain": "open.spotify.com",
		"name": "Spotify",
		"template": "https://open.spotify.com/search/{{{s}}}",
		"triggers": [
			"spotify",
			"spy",
			"spotifysearch",
			"spt"
		]
	},
	{
		"domain": "store.steampowered.com",
		"name": "Steam",
		"template": "https://store.steampowered.com/search/?term={{{s}}}",
		"triggers": [
			"steam",
			"steme",
			"ste"
		]
	},
	{
		"domain": "www.tiktok.com",
		"name": "TikTok",
		"template": "https://www.tiktok.com/search?q={{{s}}}",
		"triggers": [
			"tiktok"
		]
	},
	{
		"domain": "www.tripadvisor.com",
		"name": "Trip Advisor",
		"template": "https://www.tripadvisor.com/Search?q={{{s}}}&sub-search=Go",
		"triggers": [
			"tripadvisor"
		]
	},
	{
		"domain": "twitch.tv",
		"name": "Twitch Channel",
		"template": "https://twitch.tv/{{{s}}}",
		"triggers": [
			"twitchc",
			"twitch"
		]
	},
	{
		"domain": "www.urbandictionary.com",
		"name": "Urban Dictionary",
		"template": "https://www.urbandictionary.com/define.php?term={{{s}}}",
		"triggers": [
			"ud",
			"urbandictionary",
			"urban",
			"u"
		]
	},
	{
		"domain": "wolframalpha.com",
		"name": "Wolfram Alpha",
		"template": "https://wolframalpha.com/input?i={{{s}}}",
		"triggers": [
			"wa"
		]
	},
	{
		"domain": "www.walmart.com",
		"name": "Walmart",
		"template": "https://www.walmart.com/search/?query={{{s}}}",
		"triggers": [
			"walmart"
		]
	},
	{
		"domain": "wikipedia.org",
		"name": "Wikipedia",
		"template": "https://wikipedia.org/w/index.php?search={{{s}}}",
		"triggers": [
			"wikipedia",
			"wiki",
			"w",
			"encyclopedia",
			"wi",
			"wk"
		]
	},
	{
		"domain": "x.com",
		"icon": "assets/x.png",
		"name": "X",
		"template": "https://x.com/search?q={{{s}}}",
		"triggers": [
			"x",
			"twitter",
			"twit",
			"twid",
			"tweet"
		]
	},
	{
		"domain": "search.yahoo.com",
		"name": "Yahoo!",
		"template": "https://search.yahoo.com/search?p={{{s}}}",
		"triggers": [
			"yahoo",
			"y"
		]
	},
	{
		"domain": "www.youtube.com",
		"icon": "assets/youtube.png",
		"name": "YouTube",
		"template": "https://www.youtube.com/results?search_query={{{s}}}",
		"triggers": [
			"yt",
			"ty",
			"watch",
			"youtube",
			"you",
			"ytb"
		]
	}
] as const;
