# Vitals Extension - Modded

Custom modified version of [Vitals](https://github.com/CoreCoding/Vitals) GNOME Shell extension.

## Modifications

- **CPU Package Power (W)** — Reads Intel RAPL energy counter to display CPU wattage
- **Panel Group Labels** — Group sensors on the top bar with custom text labels (e.g. `CPU 55°C 1% 11W 4300RPM`)
- **Right-click Group Assignment** — Right-click any sensor in the dropdown to assign it to a group via dialog
- **Settings UI Toggle** — "Show group labels" switch added to extension preferences

## Installation

```bash
# Clone into GNOME extensions directory
cd ~/.local/share/gnome-shell/extensions/
git clone <repo-url> Vitals@CoreCoding.com

# Log out and log back in to load the extension
```

## Restore Settings

Settings (selected sensors, groups, preferences) are stored in **dconf**, not in this directory.  
A backup is included in `vitals-settings.txt`.

```bash
# Restore settings from backup
dconf load /org/gnome/shell/extensions/vitals/ < ~/.local/share/gnome-shell/extensions/Vitals@CoreCoding.com/vitals-settings.txt

# Export current settings (to update the backup)
dconf dump /org/gnome/shell/extensions/vitals/ > ~/.local/share/gnome-shell/extensions/Vitals@CoreCoding.com/vitals-settings.txt
```

## Requirements

- GNOME Shell 47+
- `lm_sensors` installed (`sudo dnf install lm_sensors`)
- Intel RAPL permissions for CPU power reading (udev rule at `/etc/udev/rules.d/99-rapl-permissions.rules`)

## System Info

- **Laptop:** ASUS ROG (i9-12900H / RTX 3070 Ti / 32GB RAM)
- **OS:** Fedora 43 Workstation (Wayland)
