# Decentraleyes simpler

WARNING: JUST STARTED CREATING THIS, NOT EVEN CLOSE TO USABLE YET !!!

![Do not use](http://4.bp.blogspot.com/-1lTbJMSPZaE/Tyu0eri0bOI/AAAAAAAAEP0/L6yk8jqGUwI/s1600/abnormal%2Bbrain.jpg "Do not use")

Firefox extension that eliminates most calls to common CDNs, by greatly increasing the time CDN objects will remain in the browser cache.  This stops a way that CDNs could track user activities.

Inspired by the Decentraleyes add-on by Thomas Rientjes (https://addons.mozilla.org/en-US/firefox/addon/decentraleyes/).

Some code copied from the simple-modify-headers add-on by Didierfred (https://addons.mozilla.org/en-US/firefox/addon/simple-modify-header/).

## Why Decentraleyes, and how this add-on is different from Decentraleyes

Let's say there are "web sites" which have HTML pages etc, and often the pages reference scripts and images from central "CDN" servers (such as Cloudflare).

Normally, your browser would cache items from web sites and CDNs (images, script files, HTML files, etc).  So the first time you access a page that needs script X from a CDN, the browser looks for script X in the cache, doesn't find it, and requests it from the CDN.  The next time you access a page that needs script X, the browser DOES find script X in the cache, and checks an expiration date on the cached copy.  If the expiration time has passed, the browser STILL sends a request to the CDN saying "I have date-version D of script X, if you have a newer version send it to me".  The CDN will respond either "you have the newest" (quick) or "here's a newer version" (slower).

So a CDN can use this to track your activity.  In fact, a major commonly-used CDN site such Cloudflare can use this to track your activity across MANY different web sites that reference standard items from Cloudflare.  Even if a copy of the script from Cloudflare is in your browser cache, if the expiration time has passed, Cloudflare still will see all of the "I have date-version D of script X, if you have a newer version send it to me" requests.  And those requests probably will contain your IP address and the Referrer (address of the web site you're accessing), unless you're doing something special to suppress that information.

The Decentraleyes add-on contains a bunch of scripts copied from various CDN sites, and acts as a cache that never checks for newer versions.  It supplies the scripts to your browser, so your browser doesn't contact the CDNs, and the CDNs can't track you (probably).

This is good for your privacy; stopping the CDNs from seeing your script and image accesses is a good thing.

The scripts in the Decentraleyes add-on get updated only when the developer gathers new versions of the scripts from the CDNs and then releases a new version of the add-on.

I think this is bad because you have to trust that developer (I know of no reason to distrust him, I assume he's a great guy), updates occur on a basis out of your control, and the list of domains and scripts is out of your control and not visible to you.

Instead, this "Decentraleyes simpler" add-on comes with only a list of CDN URLs.  The first time you access a page that needs script X from a CDN, the browser looks for script X in the cache, doesn't find it, and requests it from the CDN.  Then this add-on changes the expiration date of the cached copy to a date a week or a month in the future (usually they're set to expire only an hour or two later).  The next time you access a page that needs script X, the browser DOES find script X in the cache, sees the expiration time has NOT passed, and the browser doesn't need to contact the CDN.  All of the script X accesses you make for the next week or month are the same, no contact with the CDN, until the expiration time is passed.  Then one request, expiration time is set another week or month in the future, repeat.

So, I think "Decentraleyes simpler" is better than Decentraleyes.  No need to trust a developer to load scripts accurately, or rely on them to update scripts.  You will get the latest version of a script the first time you access it.  After that, the browser will not contact the CDN until the cached copy expires, a week or month later or whatever.  You control how long scripts will be cached before the browser checks for a new version.  Any time you want to force ALL the scripts to be updated, just flush your browser's cache.  Also, you can see and modify the list of URLs affected by this add-on (although you have to edit a JSON file to do so).

## Versions

### 1.0

## To-do
* Remove add-on's icon in toolbar; make UI accessible only from add-on's Preferences button in browser's Add-ons page.  Import/export is so rare that this add-on shouldn't take up toolbar space with an icon.  But there seems to be no way to remove the icon there.


## Privacy Policy

This add-on does not collect or store any of the user's private data.  All it does is use rules to modify HTTP response headers from some web sites, and implement export/import of the rules to/from JSON files.
