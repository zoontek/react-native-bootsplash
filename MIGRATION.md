# Migration from v5

## What's new

- An expo plugin 🧩
- A `ready` option in `useHideAnimation` config in order to delay your animation, if you want to wait for something else than just layout rendering + images loading 🚦
- A new Android theme: `Theme.BootSplash.TransparentStatus` (for transparent status bar + opaque navigation bar) 🫥

## What else?

- `--assets-output` now has a default value, which is `assets/bootsplash`. These assets will always be generated, as it's required for expo or the `useHideAnimation` hook (`assets/bootsplash_logo.png` become `assets/bootsplash/logo.png`, etc.)
- **All** iOS assets are now suffixed with a short hash of the different splash screen items to prevent [caching issues](https://stackoverflow.com/questions/33002829/ios-keeping-old-launch-screen-and-app-icon-after-update) (before, it was only the logo).
- iOS implementation now always uses a `colorset` for background color, even if you choose not to support dark mode (before it was inlined in the `.storyboard` file in such case).

## How to update

- Delete your previously generated assets directory.
- Run the CLI to generate assets in updated locations.
- That's all! ✨
