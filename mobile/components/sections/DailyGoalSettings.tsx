import { Text, TextInput, View } from 'react-native';
import { COLORS, SIZES } from 'shared/theme';
import { formatDuration } from 'shared/utils/formatDuration';

import { useDailyGoal } from '@/hooks/useDailyGoal';
import { globalStyles } from '@/styles/global.styles';

import ModernButton from '../ui/ModernButton';

export default function DailyGoalSettings() {
  const {
    hours,
    setHours,
    minutes,
    setMinutes,
    isSaving,
    dailyGoalSeconds,
    session,
    handleSave,
    handleRemove,
  } = useDailyGoal();

  return (
    <View style={{ width: '100%', gap: SIZES.margin }}>
      {dailyGoalSeconds !== null && (
        <View
          style={{
            backgroundColor: COLORS.subCard,
            padding: SIZES.padding,
            borderRadius: SIZES.radius,
          }}
        >
          <Text style={globalStyles.contentText}>
            Objectif actuel: {formatDuration(dailyGoalSeconds)}
          </Text>
        </View>
      )}

      <View
        style={{
          flexDirection: 'row',
          gap: SIZES.margin,
          alignItems: 'center',
        }}
      >
        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.contentText, { marginBottom: 4 }]}>Heures</Text>
          <TextInput
            style={{
              backgroundColor: COLORS.subCard,
              color: COLORS.text,
              padding: SIZES.padding,
              borderRadius: SIZES.radius,
              fontSize: 16,
            }}
            value={hours}
            onChangeText={setHours}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.text + '80'}
          />
        </View>

        <View style={{ flex: 1 }}>
          <Text style={[globalStyles.contentText, { marginBottom: 4 }]}>Minutes</Text>
          <TextInput
            style={{
              backgroundColor: COLORS.subCard,
              color: COLORS.text,
              padding: SIZES.padding,
              borderRadius: SIZES.radius,
              fontSize: 16,
            }}
            value={minutes}
            onChangeText={setMinutes}
            keyboardType="numeric"
            placeholder="0"
            placeholderTextColor={COLORS.text + '80'}
          />
        </View>
      </View>

      <ModernButton
        variant="primary"
        onPress={handleSave}
        disabled={isSaving || !session}
        icon="check"
      >
        Enregistrer l&apos;objectif
      </ModernButton>

      {dailyGoalSeconds !== null && (
        <ModernButton
          variant="danger"
          onPress={handleRemove}
          disabled={isSaving || !session}
          icon="delete"
        >
          Supprimer l&apos;objectif
        </ModernButton>
      )}
    </View>
  );
}
