# Containers settings export and import

Firefox extension that copies all Firefox container settings to/from a file.

## Status

Very incomplete, do not use !  Easy to delete all your container settings.

![Do not use](http://4.bp.blogspot.com/-1lTbJMSPZaE/Tyu0eri0bOI/AAAAAAAAEP0/L6yk8jqGUwI/s1600/abnormal%2Bbrain.jpg "Do not use")

## Versions

### 1.0
* Import wrong; the containers appear but don't "work".  Apparently the "always open new tab for domain X in container Y" assignments are stored in local storage for each extension (FMAC, Facebook Container, Google Container, etc) ?
* Alert() doesn't work properly in settings page, when add-on is loaded from .xpi file.  Works when debugging add-on.

### 1.1
* Changed to use browser notifications instead of Javascript alert().  Notifications are a little too unobtrusive for my taste, but I think that's the correct UI to use.
* Added list of container-handling extensions.


## To-do
* Import wrong; the containers appear but don't "work".  Apparently the "always open new tab for domain X in container Y" assignments are stored in local storage for each extension (FMAC, Facebook Container, Google Container, etc) ?
* Should remove cookie stuff entirely ?
* Remove add-on's icon in toolbar; have UI accessible only from add-on's Preferences button in browser's Add-ons page.  Import/export is so rare that this add-on shouldn't take up toolbar space with an icon.

