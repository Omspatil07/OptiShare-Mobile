/**
 * OptiShare - Send Screen Placeholder with File System Integration
 */

import React, { useCallback } from 'react';

import { StyleSheet, View } from 'react-native';

import { ROUTES } from '../../../app/navigation/routes';
import type { TabScreenProps } from '../../../app/navigation/types';
import { useFileSystem } from '../../../filesystem';
import { Button, Card, Icon, ScreenContainer, Text } from '../../../shared';
import { useFileStore } from '../../../store';

export function SendScreen({ navigation }: TabScreenProps<'SendTab'>): React.JSX.Element {
  const { pickSingleFile, isLoading } = useFileSystem();
  const addFile = useFileStore((state) => state.addFile);

  const handlePickFile = useCallback(async () => {
    const pickedFile = await pickSingleFile();
    if (pickedFile) {
      addFile({
        id: `picked_${Date.now()}`,
        name: pickedFile.name,
        sizeBytes: pickedFile.sizeBytes,
        mimeType: pickedFile.mimeType,
        path: pickedFile.uri,
      });
      navigation.navigate(ROUTES.FILE_PREVIEW, {
        fileName: pickedFile.name,
        fileSize: pickedFile.sizeBytes,
      });
    }
  }, [pickSingleFile, addFile, navigation]);

  return (
    <ScreenContainer scrollable={true}>
      <View style={styles.header}>
        <Text color="brand" variant="h2">
          Send Files
        </Text>
        <Text color="secondary" variant="body1">
          Select files to stream optically to receiver
        </Text>
      </View>

      <Card style={styles.card} variant="glass">
        <Icon name="copy" size={32} />
        <Text style={styles.cardTitle} variant="h3">
          Select a File to Send
        </Text>
        <Text color="secondary" style={styles.cardSub} variant="body2">
          Supports any file format up to 500MB
        </Text>
        <Button
          fullWidth={true}
          leftIcon={<Icon color="#FFFFFF" name="check" size={18} />}
          onPress={handlePickFile}
          title={isLoading ? 'Opening File Picker...' : 'Pick & Preview File'}
          variant="primary"
        />
      </Card>
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
  cardTitle: {
    marginVertical: 8,
  },
  cardSub: {
    marginBottom: 16,
    textAlign: 'center',
  },
});
