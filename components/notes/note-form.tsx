import { useState } from "react";
import { Controller, useForm } from "react-hook-form";
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from "react-native";

// icons
import { Feather } from "@expo/vector-icons";

// components
import { Button, TextField, useThemeColor } from "heroui-native";

// lib
import type { NoteFormSchema } from "@/lib/schemas/note";

interface NoteFormProps {
	initialValues?: NoteFormSchema;
	onSubmit: (data: NoteFormSchema) => void | Promise<void>;
	onCancel: () => void;
	isSubmitting?: boolean;
}

const defaultFormValues: NoteFormSchema = {
	title: "",
	body: "",
	tags: [],
};

export function NoteForm({
	initialValues,
	onSubmit,
	onCancel,
	isSubmitting = false,
}: NoteFormProps) {
	const [tagInput, setTagInput] = useState<string>("");

	const [muted, accent, foreground, surface, divider] = useThemeColor([
		"muted",
		"accent",
		"foreground",
		"surface",
		"divider",
	]);

	const { control, handleSubmit, watch, setValue, getValues } =
		useForm<NoteFormSchema>({
			defaultValues: initialValues ?? defaultFormValues,
			mode: "onChange",
		});

	const tags = watch("tags");

	const handleAddTag = () => {
		const trimmedTag = tagInput.trim();
		const currentTags = getValues("tags");

		if (trimmedTag && !currentTags.includes(trimmedTag)) {
			setValue("tags", [...currentTags, trimmedTag]);
			setTagInput("");
		}
	};

	const handleRemoveTag = (tagToRemove: string) => {
		const currentTags = getValues("tags");

		setValue(
			"tags",
			currentTags.filter((tag) => tag !== tagToRemove),
		);
	};

	return (
		<KeyboardAvoidingView
			style={{ flex: 1 }}
			behavior={Platform.OS === "ios" ? "padding" : "height"}
			keyboardVerticalOffset={Platform.OS === "ios" ? 120 : 100}
		>
			<ScrollView
				style={{ flex: 1 }}
				contentContainerStyle={{ flexGrow: 1 }}
				keyboardShouldPersistTaps="handled"
				showsVerticalScrollIndicator={false}
			>
				<View className="flex-1 p-4 gap-4">
					<Controller
						control={control}
						name="title"
						rules={{ required: "Title is required" }}
						render={({
							field: { onChange, onBlur, value },
							fieldState: { error },
						}) => (
							<TextField isRequired isInvalid={!!error}>
								<TextField.Label>Title</TextField.Label>

								<TextField.Input
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									placeholder="Enter note title"
									style={{
										backgroundColor: surface,
										borderWidth: 1,
										borderColor: divider,
										borderRadius: 8,
										padding: 12,
										color: foreground,
									}}
									placeholderTextColor={muted}
								/>

								<TextField.ErrorMessage>
									{error?.message}
								</TextField.ErrorMessage>
							</TextField>
						)}
					/>

					<Controller
						control={control}
						name="body"
						rules={{ required: "Note content is required" }}
						render={({
							field: { onChange, onBlur, value },
							fieldState: { error },
						}) => (
							<TextField isRequired isInvalid={!!error}>
								<TextField.Label>Content</TextField.Label>

								<TextField.Input
									value={value}
									onChangeText={onChange}
									onBlur={onBlur}
									placeholder="Write your note..."
									multiline
									numberOfLines={10}
									textAlignVertical="top"
									style={{
										backgroundColor: surface,
										borderWidth: 1,
										borderColor: divider,
										borderRadius: 8,
										padding: 12,
										minHeight: 200,
										color: foreground,
									}}
									placeholderTextColor={muted}
								/>

								<TextField.ErrorMessage>
									{error?.message}
								</TextField.ErrorMessage>
							</TextField>
						)}
					/>

					<View className="gap-2">
						<Text className="text-sm font-medium text-foreground">Tags</Text>

						<View className="flex-row items-center gap-2">
							<View className="flex-1">
								<TextField>
									<TextField.Input
										value={tagInput}
										onChangeText={setTagInput}
										placeholder="Add a tag"
										onSubmitEditing={handleAddTag}
										returnKeyType="done"
										style={{
											backgroundColor: surface,
											borderWidth: 1,
											borderColor: divider,
											borderRadius: 8,
											padding: 12,
											color: foreground,
										}}
										placeholderTextColor={muted}
									/>
								</TextField>
							</View>

							<Pressable
								onPress={handleAddTag}
								style={{
									backgroundColor: surface,
									borderWidth: 1,
									borderColor: divider,
									borderRadius: 8,
									padding: 12,
								}}
							>
								<Feather name="plus" size={18} color={muted} />
							</Pressable>
						</View>

						{tags.length > 0 && (
							<View className="flex-row flex-wrap gap-2 mt-2">
								{tags.map((tag) => (
									<View key={tag} className="flex-row items-center">
										<View
											style={{
												flexDirection: "row",
												alignItems: "center",
												backgroundColor: surface,
												paddingLeft: 10,
												paddingRight: 6,
												paddingVertical: 4,
												borderRadius: 12,
												borderWidth: 1,
												borderColor: accent + "30",
												gap: 6,
											}}
										>
											<Text
												style={{
													color: accent,
													fontSize: 12,
													fontWeight: "500",
												}}
											>
												{tag}
											</Text>

											<Pressable
												onPress={() => handleRemoveTag(tag)}
												hitSlop={4}
												style={({ pressed }) => ({
													opacity: pressed ? 0.6 : 1,
												})}
											>
												<Feather name="x" size={14} color={accent} />
											</Pressable>
										</View>
									</View>
								))}
							</View>
						)}
					</View>

					<View className="flex-row gap-3 mt-auto">
						<Button
							variant="secondary"
							onPress={onCancel}
							isDisabled={isSubmitting}
							className="flex-1"
						>
							<Button.Label>Cancel</Button.Label>
						</Button>

						<Button
							variant="primary"
							onPress={handleSubmit(onSubmit)}
							isDisabled={isSubmitting}
							className="flex-1"
						>
							<Button.Label>{isSubmitting ? "Saving..." : "Save"}</Button.Label>
						</Button>
					</View>
				</View>
			</ScrollView>
		</KeyboardAvoidingView>
	);
}
