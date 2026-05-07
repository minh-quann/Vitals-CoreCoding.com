import Adw from 'gi://Adw';
import Gio from 'gi://Gio';
import GObject from 'gi://GObject';
import Gtk from 'gi://Gtk';
import {ExtensionPreferences, gettext as _} from 'resource:///org/gnome/Shell/Extensions/js/extensions/prefs.js';

/*
        if (sensor == 'show-storage' && this._settings.get_boolean(sensor)) {

            let val = true;

            try {
                let GTop = imports.gi.GTop;
            } catch (e) {
                val = false;
            }

            let now = new Date().getTime();
            this._notify("Vitals", "Please run sudo apt install gir1.2-gtop-2.0", 'folder-symbolic');

        }
*/

const Settings = new GObject.Class({
    Name: 'Vitals.Settings',

    _init: function(extensionObject, params) {
        this._extensionObject = extensionObject
        this.parent(params);
            
        this._settings = extensionObject.getSettings();

        this.builder = new Gtk.Builder();
        this.builder.set_translation_domain(this._extensionObject.metadata['gettext-domain']);
        this.builder.add_from_file(this._extensionObject.path + '/prefs.ui');
        this.widget = this.builder.get_object('prefs-container');

        this._bind_settings();
    },

    // Bind the gtk window to the schema settings
    _bind_settings: function() {
        let widget;

        // process sensor toggles
        let sensors = [ 'show-temperature', 'show-voltage', 'show-fan',
                        'show-memory', 'show-processor', 'show-system',
                        'show-network', 'show-storage', 'use-higher-precision',
                        'alphabetize', 'hide-zeros', 'include-public-ip',
                        'network-public-ip-show-flag', 'show-battery', 'fixed-widths', 
                        'hide-icons', 'show-group-labels', 'menu-centered', 'include-static-info', 
                        'show-gpu', 'include-static-gpu-info', 'show-fps' ];

        for (let key in sensors) {
            let sensor = sensors[key];

            widget = this.builder.get_object(sensor);
            widget.set_active(this._settings.get_boolean(sensor));
            widget.connect('state-set', (_, val) => {
                this._settings.set_boolean(sensor, val);
            });
        }

        // process individual drop down sensor preferences
        sensors = [ 'position-in-panel', 'unit', 'network-speed-format', 'memory-measurement', 'storage-measurement', 'battery-slot', 'icon-style' ];
        for (let key in sensors) {
            let sensor = sensors[key];

            widget = this.builder.get_object(sensor);
            widget.set_active(this._settings.get_int(sensor));
            widget.connect('changed', (widget) => {
                this._settings.set_int(sensor, widget.get_active());
            });
        }

        this._settings.bind('update-time', this.builder.get_object('update-time'), 'value', Gio.SettingsBindFlags.DEFAULT);

        this._settings.bind('network-public-ip-interval', this.builder.get_object('network-public-ip-interval'),
            'value', Gio.SettingsBindFlags.DEFAULT);

        // process individual text entry sensor preferences
        sensors = [ 'storage-path', 'monitor-cmd' ];
        for (let key in sensors) {
            let sensor = sensors[key];

            widget = this.builder.get_object(sensor);
            widget.set_text(this._settings.get_string(sensor));

            widget.connect('changed', (widget) => {
                let text = widget.get_text();
                if (!text) text = widget.get_placeholder_text();
                this._settings.set_string(sensor, text);
            });
        }

        // makes individual sensor preference boxes appear
        sensors = [ 'temperature', 'network', 'storage', 'memory', 'battery', 'system', 'processor', 'gpu' ];
        for (let key in sensors) {
            let sensor = sensors[key];

            // create dialog for intelligent autohide advanced settings
            this.builder.get_object(sensor + '-prefs').connect('clicked', () => {
                let transientObj = this.widget.get_root();
                let title = sensor.charAt(0).toUpperCase() + sensor.slice(1);
                let dialog = new Gtk.Dialog({ title: _(title) + ' ' + _('Preferences'),
                                              transient_for: transientObj,
                                              use_header_bar: false,
                                              modal: true });

                let box = this.builder.get_object(sensor + '_prefs');
                dialog.get_content_area().append(box);
                dialog.connect('response', (dialog, id) => {
                    // remove the settings box so it doesn't get destroyed;
                    dialog.get_content_area().remove(box);
                    dialog.destroy();
                    return;
                });

                dialog.show();
            });
        }

        // build group manager UI
        this._buildGroupManager();
    },

    // Build the Panel Groups manager UI
    _buildGroupManager: function() {
        this._groupContainer = this.builder.get_object('panel-groups-container');
        if (!this._groupContainer) return;

        this._rebuildGroupRows();

        // Listen for external changes to panel-groups setting
        this._settings.connect('changed::panel-groups', () => {
            if (!this._isSavingPanelGroups) {
                this._rebuildGroupRows();
            }
        });
    },

    // Rebuild the group rows UI from settings
    _rebuildGroupRows: function() {
        // Clear existing children
        let child = this._groupContainer.get_first_child();
        while (child) {
            let next = child.get_next_sibling();
            this._groupContainer.remove(child);
            child = next;
        }

        let groups = this._getPanelGroups();

        // Build a row for each group
        for (let i = 0; i < groups.length; i++) {
            let group = groups[i];
            let row = new Gtk.Box({
                orientation: Gtk.Orientation.HORIZONTAL,
                spacing: 6,
                margin_top: 4,
                margin_bottom: 4,
                margin_start: 8,
                margin_end: 8,
            });

            // Group name label
            let nameLabel = new Gtk.Label({
                label: group.name,
                hexpand: true,
                halign: Gtk.Align.START
            });
            let groupIndex = i;
            
            let editBtn = new Gtk.Button({ icon_name: 'document-edit-symbolic', has_frame: false });
            editBtn.connect('clicked', () => {
                this._showNameDialog('Edit Group Name', group.name, (newName) => {
                    let g = this._getPanelGroups();
                    if (groupIndex < g.length) {
                        g[groupIndex].name = newName;
                        this._savePanelGroups(g, true);
                    }
                });
            });

            // Sensor count label
            let count = (group.sensors ? group.sensors.length : 0);
            let countLabel = new Gtk.Label({
                label: count + ' sensors',
                width_chars: 10,
            });

            // Move up button
            let upBtn = new Gtk.Button({ icon_name: 'go-up-symbolic', has_frame: false });
            upBtn.set_sensitive(i > 0);
            upBtn.connect('clicked', () => {
                let g = this._getPanelGroups();
                if (groupIndex > 0) {
                    let temp = g[groupIndex - 1];
                    g[groupIndex - 1] = g[groupIndex];
                    g[groupIndex] = temp;
                    this._savePanelGroups(g, true);
                }
            });

            // Move down button
            let downBtn = new Gtk.Button({ icon_name: 'go-down-symbolic', has_frame: false });
            downBtn.set_sensitive(i < groups.length - 1);
            downBtn.connect('clicked', () => {
                let g = this._getPanelGroups();
                if (groupIndex < g.length - 1) {
                    let temp = g[groupIndex + 1];
                    g[groupIndex + 1] = g[groupIndex];
                    g[groupIndex] = temp;
                    this._savePanelGroups(g, true);
                }
            });

            // Delete button
            let delBtn = new Gtk.Button({ icon_name: 'edit-delete-symbolic', has_frame: false });
            delBtn.add_css_class('destructive-action');
            delBtn.connect('clicked', () => {
                let g = this._getPanelGroups();
                if (groupIndex < g.length) {
                    g.splice(groupIndex, 1);
                    this._savePanelGroups(g, true);
                }
            });

            row.append(nameLabel);
            row.append(editBtn);
            row.append(countLabel);
            row.append(upBtn);
            row.append(downBtn);
            row.append(delBtn);

            let listRow = new Gtk.ListBoxRow({ selectable: false, focusable: false });
            listRow.set_child(row);
            this._groupContainer.append(listRow);
        }

        // Add "New Group" row
        let addRow = new Gtk.Box({
            orientation: Gtk.Orientation.HORIZONTAL,
            spacing: 6,
            margin_top: 4,
            margin_bottom: 4,
            margin_start: 8,
            margin_end: 8,
        });

        let addBtn = new Gtk.Button({ label: '+ Add Group', hexpand: true });
        addBtn.add_css_class('suggested-action');
        addBtn.connect('clicked', () => {
            this._showNameDialog('New Group', '', (name) => {
                let g = this._getPanelGroups();
                g.push({ name: name, sensors: [] });
                this._savePanelGroups(g, true);
            });
        });

        addRow.append(addBtn);
        let addListRow = new Gtk.ListBoxRow({ selectable: false, focusable: false });
        addListRow.set_child(addRow);
        this._groupContainer.append(addListRow);
    },

    _showNameDialog: function(title, initialName, callback) {
        let transientObj = this.widget.get_root();
        let dialog = new Gtk.Dialog({
            title: title,
            transient_for: transientObj,
            use_header_bar: 1,
            modal: true
        });

        let entry = new Gtk.Entry({
            text: initialName,
            margin_top: 12,
            margin_bottom: 12,
            margin_start: 12,
            margin_end: 12,
            activates_default: true,
            width_request: 250
        });

        dialog.get_content_area().append(entry);

        dialog.add_button('Cancel', Gtk.ResponseType.CANCEL);
        let saveBtn = dialog.add_button('Save', Gtk.ResponseType.OK);
        saveBtn.add_css_class('suggested-action');
        dialog.set_default_response(Gtk.ResponseType.OK);

        dialog.connect('response', (dlg, response) => {
            if (response === Gtk.ResponseType.OK) {
                let text = entry.get_text().trim();
                if (text) {
                    callback(text);
                }
            }
            dlg.destroy();
        });

        dialog.show();
    },

    _getPanelGroups: function() {
        try {
            return JSON.parse(this._settings.get_string('panel-groups'));
        } catch (e) {
            return [];
        }
    },

    _savePanelGroups: function(groups, rebuild) {
        this._isSavingPanelGroups = true;
        this._settings.set_string('panel-groups', JSON.stringify(groups));
        this._isSavingPanelGroups = false;
        if (rebuild) this._rebuildGroupRows();
    }
});

 
export default class VitalsPrefs extends ExtensionPreferences {
    fillPreferencesWindow(window) {
        window._settings = this.getSettings();

        let settings = new Settings(this);
        let widget = settings.widget;

        const page = new Adw.PreferencesPage();
        const group = new Adw.PreferencesGroup({});
        group.add(widget);
        page.add(group);
        window.add(page);
        window.set_default_size(widget.width, widget.height);
        widget.show();
    }
}
