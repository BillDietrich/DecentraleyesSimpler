# Containers settings export and import

Firefox extension that copies top level of Firefox container settings to/from a file.

WARNING: This extension does NOT copy the "always open new tab for domain X in container Y" assignments for each container, and other detailed settings, and any cookies.  It copies only the container names and icons and colors.  So import should really only be used into a new profile with no containers set up yet.

## Usage

Importing:

1. Create new profile or use a profile that has no container settings in it.
2. Install the various container-type extensions (Firefox Multi-Account Containers, Facebook Container, etc) and this extension.
3. Go through the "get started" steps in some extensions (Firefox Multi-Account Containers).
4. Use this extension to do import from file, with "delete all existing containers" checked.
5. Use the various container-type extensions to finish settings in the containers which were imported.

## Versions

### 1.0
* Import wrong; the containers appear but don't "work".  Apparently the "always open new tab for domain X in container Y" assignments are stored in local storage for each extension (FMAC, Facebook Container, Google Container, etc) ?
* Alert() doesn't work properly in settings page, when add-on is loaded from .xpi file.  Works when debugging add-on.

### 1.1
* Changed to use browser notifications instead of Javascript alert().  Notifications are a little too unobtrusive for my taste, but I think that's the correct UI to use.
* Added list of container-handling extensions.

### 1.2
* Stripped it down to do just the top-level container / identity information.
* Tweaked descriptions to emphasize "does just the top-level information".
* Added lots of warnings and instructions to README and to Preferences page.

### 1.3
* Tweaked HTML of options page because Firefox went to tabs in the add-on settings page.
* Tweaked instructions.
* Added to list of container extensions.

## To-do
* Import wrong; the containers appear but don't "work".  Apparently the "always open new tab for domain X in container Y" assignments are stored in local storage for each extension (FMAC, Facebook Container, Google Container, etc) and there's no way for this extension to get at them.
* Remove add-on's icon in toolbar; make UI accessible only from add-on's Preferences button in browser's Add-ons page.  Import/export is so rare that this add-on shouldn't take up toolbar space with an icon.  But there seems to be no way to remove the icon there.

