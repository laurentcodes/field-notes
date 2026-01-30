import { NativeTabs, Label, Icon } from "expo-router/unstable-native-tabs";
import { useThemeColor } from "heroui-native";

export default function TabLayout() {
	const [background, accent] = useThemeColor(["background", "accent"]);

	return (
		<NativeTabs tintColor={accent} disableTransparentOnScrollEdge>
			<NativeTabs.Trigger
				name="index"
				options={{
					backgroundColor: background,
				}}
			>
				<Label>Notes</Label>
				<Icon
					sf={{ default: "note.text", selected: "note.text" }}
					drawable="ic_menu_edit"
				/>
			</NativeTabs.Trigger>

			<NativeTabs.Trigger
				name="settings"
				options={{
					backgroundColor: background,
				}}
			>
				<Label>Settings</Label>
				<Icon
					sf={{ default: "gearshape", selected: "gearshape.fill" }}
					drawable="ic_settings"
				/>
			</NativeTabs.Trigger>
		</NativeTabs>
	);
}
