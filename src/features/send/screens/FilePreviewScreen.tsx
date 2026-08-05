/**
 * OptiShare - File Preview Screen Placeholder
 */

import React from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { RootStackScreenProps } from '../../../app/navigation/types';
import { Button, Card, Icon, ScreenContainer, Text, useTheme } from '../../../shared';

export function FilePreviewScreen({
  route,
  navigation,
}: RootStackScreenProps<'FilePreview'>): React.JSX.Element {
  const { theme } = useTheme();
  const fileName = route.params?.fileName || 'document.pdf';
  const fileSize = route.params?.fileSize
    ? `${(route.params.fileSize / 1000000).toFixed(2)} MB`
    : '2.45 MB';

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          File Preview
        </Text>
      </View>

      <Card style={styles.card} variant="elevated">
        <Icon color={theme.colors.primary} name="copy" size={48} />
        <Text style={styles.fileName} variant="h3">
          {fileName}
        </Text>
        <Text color="secondary" variant="body1">
          Size: {fileSize}
        </Text>
      </Card>

      <Button
        fullWidth={true}
        leftIcon={<Icon color="#FFFFFF" name="check" size={18} />}
        onPress={() => navigation.navigate(ROUTES.TRANSFER_PROGRESS, { role: 'sender' })}
        style={styles.button}
        title="Start Optical Stream"
        variant="primary"
      />
      <Button
        fullWidth={true}
        onPress={() => navigation.goBack()}
        style={styles.buttonMargin}
        title="Cancel"
        variant="ghost"
      />
    </ScreenContainer>
  );
}

const styles = StyleSheet.create({
  header: {
    marginVertical: 16,
  },
  card: {
    marginVertical: 16,
    alignItems: 'center',
  },
  fileName: {
    marginVertical: 8,
  },
  button: {
    marginTop: 16,
  },
  buttonMargin: {
    marginTop: 8,
  },
});
