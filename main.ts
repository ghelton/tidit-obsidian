import dayjs from "dayjs";
import {
	App,
	Editor,
	MarkdownView,
	Notice,
	Plugin,
	PluginSettingTab,
	Setting,
} from "obsidian";


interface TiditPluginSettings {
	tiditOn: boolean;
	timestampFormat: string;
	addAfterDelay: number;
	insertNewLineAfterTimestamp: boolean;
}

const DEFAULT_SETTINGS: TiditPluginSettings = {
	tiditOn: true,
	timestampFormat: "YYYY-MM-DD HH:mm:ss",
	addAfterDelay: 60,
	insertNewLineAfterTimestamp: false,
};

export default class TiditPlugin extends Plugin {
	settings: TiditPluginSettings;
	statusBarItemEl: HTMLElement;
	lastTimeStampInsertTimestamp: dayjs.Dayjs;
	currFileName: string;

	insertTextAtLine(editor: Editor, line: number, pos: number, ts: string) {
		const t = this.settings.insertNewLineAfterTimestamp ? ts : `${ts}`;
		editor.replaceRange(t, { line: line, ch: pos });
	}

	getFormattedTimestamp() {
		const timestamp = dayjs().format(this.settings.timestampFormat);
		return this.settings.insertNewLineAfterTimestamp
			? `${timestamp}\n`
			: `${timestamp} `;
	}

	resetTimeStampInsertTimestamp() {
		this.lastTimeStampInsertTimestamp = dayjs(0);
	}

	isCursorInListLine(line: string): boolean {
		// Check if the current line is a list item (starts with '-', '*', or a number)
		if (/^\s*[-*+]\s/.test(line) || /^\s*\d+\.\s/.test(line)) {
			return true;
		}
		return false;
	}

	isCodeBlockStartEnd(line: string): boolean {
		return line.startsWith("`") || line.endsWith("```");
	}

	getInsertPositionInLine(editor: Editor): number {
		const cursor = editor.getCursor();
		// line already moved with the ENTER key. look back one line
		const lineText = editor.getLine(cursor.line - 1);
		if (this.isCursorInListLine(lineText)) {
			return -1;
		}

		if (this.isCodeBlockStartEnd(lineText)) {
			return -1;
		}
		return 0;
	}

	async onload() {
		await this.loadSettings();
		const file = this.app.workspace.activeEditor?.file;
		if (file) {
			this.currFileName = file.name;
		} else {
			this.currFileName = "";
		}

		this.resetTimeStampInsertTimestamp();

		this.statusBarItemEl = this.addStatusBarItem();

		this.addCommand({
			id: "tidit-on-off-command",
			name: "Turn tidit on/off",
			editorCallback: (editor: Editor, view: MarkdownView) => {
				this.settings.tiditOn = !this.settings.tiditOn;

				this.updateStatusText();

				new Notice(
					this.settings.tiditOn
						? "tidit will add timestamps to your document"
						: "tidit will stop adding timestamps to your document"
				);
			},
		});

		this.addCommand({
			id: "tidit-editor-command",
			name: "Insert Timestamp",
			editorCallback: (editor: Editor) => {
				const cursor = editor.getCursor();
				const ts = this.getFormattedTimestamp();
				this.insertTextAtLine(editor, cursor.line, cursor.ch, ts);
				editor.setCursor(cursor.line, ts.length + cursor.ch);
			},
		});

		this.addSettingTab(new TiditSettingTab(this.app, this));

		this.registerDomEvent(document, "keydown", (e: KeyboardEvent) => {
			if (!this.settings.tiditOn) return;

			if (e.key !== "Enter") return;

			const editor = this.app.workspace.activeEditor?.editor;

			if (!editor) return;

			const file = this.app.workspace.activeEditor?.file;
			if (file) {
				// reset timestamp upon file / tab change
				if (this.currFileName !== file.name) {
					this.currFileName = file.name;
					this.resetTimeStampInsertTimestamp();
				}
			} else {
				return;
			}

			const cursor = editor.getCursor();

			const now = dayjs();
			if (
				now.diff(this.lastTimeStampInsertTimestamp, "seconds") <
				this.settings.addAfterDelay
			) {
				return;
			}

			const pos = this.getInsertPositionInLine(editor);
			if (pos === -1) {
				return;
			}

			const timestamp = this.getFormattedTimestamp();

			// Insert timestamp at the beginning of the previous line
			this.insertTextAtLine(
				editor,
				Math.max(0, cursor.line - 1),
				pos,
				timestamp
			);
			this.lastTimeStampInsertTimestamp = dayjs();
		});
	}

	onunload() {}

	async loadSettings() {
		this.settings = Object.assign(
			{},
			DEFAULT_SETTINGS,
			await this.loadData()
		);
	}

	async saveSettings() {
		await this.saveData(this.settings);
		// reset the last ts insert
		this.resetTimeStampInsertTimestamp();
	}

	async updateStatusText() {
		this.statusBarItemEl.setText(
			this.settings.tiditOn ? "tidit on" : "tidit off"
		);
	}
}

class TiditSettingTab extends PluginSettingTab {
	plugin: TiditPlugin;

	constructor(app: App, plugin: TiditPlugin) {
		super(app, plugin);
		this.plugin = plugin;
	}

	display(): void {
		const { containerEl } = this;

		containerEl.empty();

		new Setting(containerEl).setName("Tidit Settings");

		new Setting(containerEl)
			.setName("Tidit on/off")
			.setDesc(
				"Aside from disabling the plugin, you can use this setting to stop adding timestamps. Suggest binding to hotkey."
			)
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.tiditOn)
					.onChange(async (value) => {
						this.plugin.settings.tiditOn = value;
						this.plugin.updateStatusText();
					})
			);

		new Setting(containerEl)
			.setName("Timestamp Format")
			.setDesc(
				"Must be a valid format. See https://day.js.org/docs/en/display/format"
			)
			.addText((text) =>
				text
					.setPlaceholder("YYYY-MM-DD HH:mm:ss")
					.setValue(this.plugin.settings.timestampFormat)
					.onChange(async (value) => {
						this.plugin.settings.timestampFormat = value;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Add timestamp after delay")
			.setDesc(
				"0 for every enter key, or positive integer for seconds after. Max is 1234 seconds"
			)
			.addText((text) =>
				text
					.setPlaceholder("0, or positive integer")
					.setValue(this.plugin.settings.addAfterDelay.toString())
					.onChange(async (value) => {
						const v = Math.max(
							Math.min(Number.parseInt(value), 1234)
						);
						this.plugin.settings.addAfterDelay = v;
						await this.plugin.saveSettings();
					})
			);

		new Setting(containerEl)
			.setName("Insert new line after timestamp")
			.addToggle((toggle) =>
				toggle
					.setValue(this.plugin.settings.insertNewLineAfterTimestamp)
					.onChange(async (value) => {
						this.plugin.settings.insertNewLineAfterTimestamp =
							value;
					})
			);
	}
}
