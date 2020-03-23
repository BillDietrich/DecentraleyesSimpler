# Decentraleyes simpler

Firefox extension that eliminates most fetching from some common CDNs, by greatly increasing the time CDN objects will remain in the browser cache.  This stops a way that CDNs could track user activities.

Inspired by the [Decentraleyes add-on](https://addons.mozilla.org/en-US/firefox/addon/decentraleyes/ "Decentraleyes add-on") by Thomas Rientjes.

Some code copied from the [simple-modify-headers](https://addons.mozilla.org/en-US/firefox/addon/simple-modify-header/ "simple-modify-headers") add-on by Didierfred.

## Why Decentraleyes, and how this add-on is different from Decentraleyes

Let's say there are "web sites" which have HTML pages etc, and often the pages reference scripts and images from central "CDN" servers (such as Cloudflare).

Normally, your browser would cache items from web sites and CDNs (images, script files, HTML files, etc).  So the first time you access a page that needs script X from a CDN, the browser looks for script X in the cache, doesn't find it, and requests it from the CDN.  The next time you access a page that needs script X, the browser **does** find script X in the cache, and checks an expiration date on the cached copy.  If the expiration time has passed, the browser **still** sends a request to the CDN saying "I have date-version D of script X, if you have a newer version send it to me".  The CDN will respond either "you have the newest" (quick) or "here's a newer version" (slower).

So a CDN can use this to track your activity.  In fact, a major commonly-used CDN site such Cloudflare can use this to track your activity across **many** different web sites that all reference standard items from Cloudflare.  Even if a copy of the script from Cloudflare is in your browser cache, if the expiration time has passed, Cloudflare still will see all of the "I have date-version D of script X, if you have a newer version send it to me" requests.  And those requests probably will contain your IP address and user-agent info and address of the web site you're accessing (see for example
[MDN's "Referer header: privacy and security concerns"](https://developer.mozilla.org/en-US/docs/Web/Security/Referer_header:_privacy_and_security_concerns "MDN's 'Referer header: privacy and security concerns'")), unless you're doing something special to suppress that information.

The Decentraleyes add-on contains a bunch of scripts copied from various CDN sites, and acts as a cache that **never** checks for newer versions.  It supplies the scripts to your browser, so your browser doesn't contact the CDNs, and the CDNs can't track you (probably).

This is good for your privacy; stopping the CDNs from seeing your script and image accesses is a good thing.

The scripts in the Decentraleyes add-on get updated only when the developer gathers new versions of the scripts from the CDNs and then releases a new version of the add-on.

I think this is bad because you have to trust that developer (I know of no reason to distrust him, I assume he's a great guy), updates occur on a basis out of your control, and the list of domains and scripts is out of your control and not visible to you.

Instead, this "Decentraleyes simpler" add-on comes with only a list of CDN URL patterns.  The first time you access a page that needs script X from a CDN, the browser looks for script X in the cache, doesn't find it, and requests it from the CDN.  Then this add-on changes the expiration date of the cached copy to a date a month in the future (usually they're set to expire only an hour or two later).  The next time you access a page that needs script X, the browser **does** find script X in the cache, sees the expiration time has **not** passed, and the browser doesn't need to contact the CDN.  All of the script X accesses you make for the next month are the same, no contact with the CDN, until the expiration time is passed.  Then one request, expiration time is set another month in the future, repeat.

So, I think "Decentraleyes simpler" is better than Decentraleyes.  No need to trust a developer to load scripts accurately, or rely on them to update scripts.  You will get the latest version of a script the first time you access it.  After that, the browser will not contact the CDN until the cached copy expires.  You control how long scripts will be cached before the browser checks for a new version.  Any time you want to force **all** the scripts to be updated, just flush your browser's cache.  Also, you can see and modify the list of URL patterns affected by this add-on (although you have to edit a JSON file to do so).  You could add patterns to increase caching of any sites you wished, not just major CDNs.

## Quirks / Notes
* To see and change the settings and patterns used by this add-on, you have to export the info to a JSON file, edit that file, and import the changed file back into the add-on.  There is no nice GUI for seeing and changing settings, sorry.
* Default list of URL patterns is mostly copied from the mappings.js file in the [Decentraleyes add-on](https://addons.mozilla.org/en-US/firefox/addon/decentraleyes/ "Decentraleyes add-on") by Thomas Rientjes.  But there's a lot of complexity in that add-on that is not replicated in this add-on.  And I made a few additions.
* You can specify excluded-URL prefixes.  This means an URL matched by one of the patterns can be excluded (cache expiration time not altered) by a matching prefix.
* Note that match-patterns and excluded-URL prefixes have different syntax.  Patterns look like `*://code.jquery.com/*` and exclusion prefixes look like `https://code.jquery.com/`.
* By default, this add-on operates on fonts, images, scripts, and stylesheets.
* Clearing the browser cache clears the **whole** cache, not just items that match this add-on's URL patterns.
* Cache expiration time is set for items that match, even if their expiration time already is **longer** than the time specified for this add-on.
* Cache directive is set to **solely** "max-age=NNN" for items that match, even if their existing cache directive contains other qualifiers such as "public" or "private" or "no-cache" etc.
* A determined CDN could defeat this type of add-on, by generating script or image names that are unique for each user session.
* I think most big installations use their own copy of the CDN's static content; for example maybe Exxon.com would have a copy of Google's APIs under Exxon.com instead of referencing gstatic.com all the time.  In which case this add-on isn't useful.
* If you use "about:cache" and look in the "disk cache", you will see strange stuff from some sites.  For example, fairly transient images put in with 10-year expiration times.  I wonder if cache performance would be improved if something trimmed those times down.

## Versions

### 1.0 - 1.6
* Get the basics going, test, publish

### 1.7
* Fixed bug in import where new config didn't get saved to storage.
* Added cdn.ampproject.org and cdn.datatables.net to default config.

### 1.8
* Updated node to 13.11.0, npm to 6.14.2, web-ext to 4.1.0.
* Now testing with Firefox 74.0.
* Used code fragment from https://github.com/Crystal-RainSlide to format exported JSON file with tabs instead of spaces.

### 1.9
* Added CSS from https://github.com/Crystal-RainSlide but didn't really see any change.
* Disabled Import button until a source file is picked.

### 2.0
* Added exclude-URL prefixes.
* I think I fixed a bug where import worked but the new settings were not used until next time the extension was loaded.
* Removed request listener, since it wasn't doing anything, only need to process responses.


## To-do
* Remove add-on's icon in toolbar; make UI accessible only from add-on's Preferences button in browser's Add-ons page.  Import/export is so rare that this add-on shouldn't take up toolbar space with an icon.  But there seems to be no way to remove the icon there.

## Development
* Version number has to be changed in both package.json and manifest.json
* Debug extension via
`web-ext run`
or similar, which will launch Firefox.  Go to "about:debugging".
Click on "This Firefox" link.  Click on "Inspect" button.
Click on "console" tab.  Then click on add-on's icon in toolbar to open prefs page.
* Use Firefox about:cache to see what is in the cache.
* Add and delete a file from web site to verify that it is being accessed from cache when it is not present on the web site.
* Commit files to GitHub, then before publishing do (on disk):

    `zip decentraleyessimplerN.N.zip b* icon* L* m* o* p* R*`

## Privacy Policy

This add-on does not collect or store any of the user's private data.  All it does is use rules to modify HTTP response headers from some web sites, and implement export/import of the rules to/from JSON files.
