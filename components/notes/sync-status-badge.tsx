import { View, Text } from 'react-native';
import { useThemeColor } from 'heroui-native';

// icons
import { Feather } from '@expo/vector-icons';

// lib
import type { SyncStatus } from '@/lib/types/note';

interface SyncStatusBadgeProps {
  status: SyncStatus;
}

const statusConfig = {
  synced: {
    color: 'success' as const,
    icon: 'check' as const,
    label: 'Synced',
  },
  pending: {
    color: 'warning' as const,
    icon: 'cloud' as const,
    label: 'Pending',
  },
  failed: {
    color: 'danger' as const,
    icon: 'alert-circle' as const,
    label: 'Failed',
  },
};

export function SyncStatusBadge({ status }: SyncStatusBadgeProps) {
  const config = statusConfig[status];

  const colorValue = useThemeColor(config.color);

  return (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderRadius: 12,
        backgroundColor: colorValue + '20',
      }}
    >
      <Feather name={config.icon} size={12} color={colorValue} />

      <Text style={{ color: colorValue, fontSize: 12, fontWeight: '500' }}>
        {config.label}
      </Text>
    </View>
  );
}
