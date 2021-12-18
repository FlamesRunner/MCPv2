const parseMinecraftConsoleOutput = (output: string[]): string => {
	const parsedLines = output.map((line) => {
		// Parse colours from Minecraft console output (replace with span tags with colour in css)
		// Format:
		// §4: #AA0000
		// §c: #FF5555
		// §6: #FFAA00
		// §e: #FFFF55
		// §2: #00AA00
		// §a: #55FF55
		// §b: #55FFFF
		// §3: #00AAAA
		// §1: #0000AA
		// §9: #5555FF
		// §d: #FF55FF
		// §5: #AA00AA
		// §7: #AAAAAA
		// §8: #555555
		// §f: #FFFFFF
		// §0: #000000

		const colourMap: { [key: string]: string } = {
			"4": "#AA0000",
			c: "#FF5555",
			"6": "#FFAA00",
			e: "#FFFF55",
			"2": "#00AA00",
			a: "#55FF55",
			b: "#55FFFF",
			"3": "#00AAAA",
			"1": "#0000AA",
			"9": "#5555FF",
			d: "#FF55FF",
			"5": "#AA00AA",
			"7": "#AAAAAA",
			"8": "#555555",
			f: "#FFFFFF",
			"0": "#000000",
			r: "rgba(5, 150, 105)",
		};

		// If some line has a colour, replace it with a span tag with the colour. Ensure the span tag is closed, even if the line doesn't any further colours.
		let parsedLine = line;
		let occurrences = 0;
		const prefixes = ["§", "&"];

		// Replace all occurrences of a colour with a span tag with the colour and set occurrences to the number of colours replaced.
		Object.keys(colourMap).forEach((colour) => {
			for (let i = 0; i < prefixes.length; i++) {
				const regex = new RegExp(prefixes[i] + colour, "g");
				occurrences += parsedLine.match(regex)?.length ?? 0;
				parsedLine = parsedLine.replace(
					regex,
					`<span style="color: ${colourMap[colour]}">`
				);
			}
		});

		for (let i = 0; i < occurrences; i++) {
			parsedLine = parsedLine + "</span>";
		}

		return parsedLine;
	});
	return parsedLines.join("");
};

export default parseMinecraftConsoleOutput;