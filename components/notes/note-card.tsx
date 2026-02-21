import { View, Text, Pressable } from "react-native";
import { useThemeColor } from "heroui-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withTiming,
  runOnJS,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";

// icons
import { Feather } from "@expo/vector-icons";

// components
import { Card } from "heroui-native";
import { SyncStatusBadge } from "./sync-status-badge";

// lib
import type { NoteWithSync } from "@/lib/types/note";

const SWIPE_THRESHOLD = -80;
const DELETE_THRESHOLD = -160;

interface NoteCardProps {
  note: NoteWithSync;
  onPress: () => void;
  onDelete?: () => void;
}

function formatDate(timestamp: number): string {
  const date = new Date(timestamp);
  return date.toLocaleDateString("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  });
}

export interface TagBadgeProps {
  label: string;
}

export function TagBadge({ label }: TagBadgeProps) {
  const [accent, surface] = useThemeColor(["accent", "surface"]);

  return (
    <View
      style={{
        backgroundColor: surface,
        paddingHorizontal: 8,
        paddingVertical: 3,
        borderRadius: 12,
        borderWidth: 1,
        borderColor: accent + "30",
      }}
    >
      <Text style={{ color: accent, fontSize: 12, fontWeight: "500" }}>
        {label}
      </Text>
    </View>
  );
}

export function NoteCard({ note, onPress, onDelete }: NoteCardProps) {
  const displayTags = note.tags.slice(0, 3);
  const hasMoreTags = note.tags.length > 3;

  const danger = useThemeColor("danger");
  const translateX = useSharedValue<number>(0);

  const handleDelete = () => {
    onDelete?.();
  };

  const panGesture = Gesture.Pan()
    .activeOffsetX([-10, 10])
    .failOffsetY([-5, 5])
    .onUpdate((event) => {
      // only allow swiping left
      if (event.translationX < 0) {
        translateX.value = event.translationX;
      }
    })
    .onEnd((event) => {
      if (event.translationX < DELETE_THRESHOLD) {
        // swiped far enough to delete
        translateX.value = withTiming(-400, { duration: 200 });
        runOnJS(handleDelete)();
      } else {
        // snap back
        translateX.value = withTiming(0, { duration: 200 });
      }
    });

  const cardStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const deleteActionStyle = useAnimatedStyle(() => ({
    opacity: translateX.value < SWIPE_THRESHOLD ? 1 : 0.6,
  }));

  return (
    <View style={{ position: "relative", overflow: "hidden" }}>
      <Animated.View
        style={[
          {
            position: "absolute",
            right: 0,
            top: 0,
            bottom: 0,
            width: 200,
            justifyContent: "center",
            alignItems: "flex-end",
            paddingRight: 24,
          },
          deleteActionStyle,
        ]}
      >
        <View style={{ alignItems: "center", gap: 4 }}>
          <Feather name="trash-2" size={20} color={danger} />

          <Text style={{ color: danger, fontSize: 12, fontWeight: "500" }}>
            Delete
          </Text>
        </View>
      </Animated.View>

      <GestureDetector gesture={panGesture}>
        <Animated.View style={cardStyle}>
          <Pressable onPress={onPress}>
            <Card className="mx-4 my-2">
              <Card.Body className="gap-2">
                <View className="flex-row items-start justify-between">
                  <Text
                    className="text-base font-semibold text-foreground flex-1"
                    numberOfLines={1}
                  >
                    {note.title}
                  </Text>

                  <SyncStatusBadge status={note.syncStatus} />
                </View>

                <Text className="text-sm text-muted" numberOfLines={2}>
                  {note.body}
                </Text>

                <View className="flex-row items-center justify-between mt-1">
                  <View className="flex-row gap-1 flex-1">
                    {displayTags.map((tag) => (
                      <TagBadge key={tag} label={tag} />
                    ))}

                    {hasMoreTags && (
                      <TagBadge label={`+${note.tags.length - 3}`} />
                    )}
                  </View>

                  <Text className="text-xs text-muted">
                    {formatDate(note.updatedAt)}
                  </Text>
                </View>
              </Card.Body>
            </Card>
          </Pressable>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}
