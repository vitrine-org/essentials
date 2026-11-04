# Essentials for Vitrine

The everyday widgets for [Vitrine](https://github.com/vitrine-org/vitrine), in the Windows 11 style.
Every widget comes as an acrylic card, frosted glass that blurs and saturates the wallpaper behind it,
or with no background at all, drawn straight on the wallpaper with shadows that keep it readable.
Light and dark follow Windows live (Theme: System), or pick one; the accent follows Windows too, or
pick your own.

| Widget | Size | |
|---|---|---|
| **Clock**: time and date in your locale, 12/24-hour | 2×1 to 4×2 | ![Clock](src/clock/preview.png) |
| **Calendar**: month view, today highlighted, previous and next month | 3×3 to 4×4 | ![Calendar](src/calendar/preview.png) |
| **System**: CPU, memory and disk as rings or bars | 3×2 to 4×2 | ![System](src/system/preview.png) |
| **Network**: download and upload speed | 3×1 to 4×1 | ![Network](src/network/preview.png) |
| **Battery**: charge level, charging state, time left | 2×1 to 3×1 | ![Battery](src/battery/preview.png) |
| **Weather**: current conditions and 3 days from [Open-Meteo](https://open-meteo.com), works offline from cache | 3×2 to 4×2 | ![Weather](src/weather/preview.png) |
| **Analog Clock**: dial with ticks, numerals or minimal, sweeping second hand | 2×2 to 4×4 | ![Analog Clock](src/analog/preview.png) |
| **To Do**: click a task to check it off, clear the done ones, add and edit tasks in place | 2×2 to 4×4 | ![To Do](src/todo/preview.png) |
| **Note**: a sticky note in five tints, click to edit | 2×2 to 4×4 | ![Note](src/notes/preview.png) |
| **Links**: up to eight sites, one click to open | 2×1 to 4×2 | ![Links](src/links/preview.png) |
| **Drives**: free space on every drive | 3×1 to 4×4 | ![Drives](src/drives/preview.png) |
| **Countdown**: days left to a date, or to New Year | 2×1 to 4×2 | ![Countdown](src/countdown/preview.png) |
| **Progress**: how much of the day, week, month and year has gone, as bars or rings | 3×2 to 4×2 | ![Progress](src/progress/preview.png) |

To Do and Note type through Vitrine's text flyout where the engine has it; otherwise enter tasks
and text in the widget settings.

## Build

```sh
npm install
npm run pack      # → essentials-2.1.2.vitrine
```

`package.json` depends on `github:vitrine-org/sdk#v2.1.0`, which provides `prompt()` for the to-do
and note text entry.

Preview a widget: `vitrine render dist weather --cells 3x2 --network --out weather.png`.

Regenerate every `src/<widget>/preview.png` after `npm run build` with `py scripts/previews.py` (needs Pillow and `vitrine.exe`): same theme, accent and default size for all widgets, on a transparent background, cut to the card's rounded shape over a flat neutral backdrop, so the gallery, store and website show them alike on a neutral tile.

## License

MIT
