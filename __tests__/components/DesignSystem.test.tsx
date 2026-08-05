/**
 * Design System Component Test Suite
 *
 * Verifies rendering, theme context, interaction handling,
 * variants, colors, and accessibility props across design system components.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
import { Pressable, TextInput as RNTextInput } from 'react-native';
import {
  Button,
  Card,
  Divider,
  Icon,
  Input,
  Loader,
  ScreenContainer,
  Text,
  ThemeProvider,
  useTheme,
} from '../../src/shared';

function ThemeTestComponent(): React.JSX.Element {
  const { isDarkMode, toggleTheme } = useTheme();
  return (
    <Button
      onPress={toggleTheme}
      testID="theme-toggle-btn"
      title={isDarkMode ? 'Dark Mode' : 'Light Mode'}
    />
  );
}

describe('OptiShare Design System', () => {
  it('renders Text component with variants, colors, and weights', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Text variant="h1" color="primary" weight="bold">Heading Title</Text>
          <Text variant="h2" color="secondary">H2 Title</Text>
          <Text variant="h3" color="tertiary">H3 Title</Text>
          <Text variant="h4" color="error">H4 Title</Text>
          <Text variant="body1" color="success">Body Content</Text>
          <Text variant="body2" color="warning">Body2 Content</Text>
          <Text variant="caption" color="inverse">Caption Text</Text>
          <Text variant="label" color="brand">Label Text</Text>
          <Text variant="button" color="#FF0000" align="center">Button Text</Text>
        </ThemeProvider>
      );
    });

    const textNodes = renderer!.root.findAllByType(Text);
    expect(textNodes.length).toBe(9);
    expect(textNodes[0].props.children).toBe('Heading Title');
  });

  it('renders Button with all variants, sizes, and states', async () => {
    const onPressMock = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Button onPress={onPressMock} size="sm" title="Primary Sm" variant="primary" />
          <Button onPress={onPressMock} size="md" title="Secondary Md" variant="secondary" />
          <Button onPress={onPressMock} size="lg" title="Outline Lg" variant="outline" />
          <Button disabled={true} onPress={onPressMock} title="Ghost Disabled" variant="ghost" />
          <Button fullWidth={true} leftIcon={<Icon name="check" />} onPress={onPressMock} rightIcon={<Icon name="close" />} title="Danger Full" variant="danger" />
        </ThemeProvider>
      );
    });

    const buttons = renderer!.root.findAllByType(Button);
    expect(buttons.length).toBe(5);

    await act(async () => {
      buttons[0].props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);

    // Test loading state
    await act(async () => {
      renderer.update(
        <ThemeProvider>
          <Button loading={true} onPress={onPressMock} title="Loading Button" />
        </ThemeProvider>
      );
    });

    const loaderInstance = renderer!.root.findByType(Loader);
    expect(loaderInstance).toBeTruthy();
  });

  it('renders Card with all variants and paddings', async () => {
    const onCardPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Card padding="sm" variant="elevated">
            <Text>Elevated Card</Text>
          </Card>
          <Card padding="md" variant="outlined">
            <Text>Outlined Card</Text>
          </Card>
          <Card padding="lg" variant="filled">
            <Text>Filled Card</Text>
          </Card>
          <Card onPress={onCardPress} padding="none" variant="glass">
            <Text>Glass Card</Text>
          </Card>
        </ThemeProvider>
      );
    });

    const cards = renderer!.root.findAllByType(Card);
    expect(cards.length).toBe(4);

    await act(async () => {
      cards[3].props.onPress();
    });
    expect(onCardPress).toHaveBeenCalledTimes(1);
  });

  it('renders Input with focus, blur, clear button, error, and secure toggle', async () => {
    const onChangeTextMock = jest.fn();
    const onFocusMock = jest.fn();
    const onBlurMock = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Input
            error="Required field"
            helperText="Please enter your email"
            label="Email Input"
            leftIcon={<Icon name="search" />}
            onBlur={onBlurMock}
            onChangeText={onChangeTextMock}
            onFocus={onFocusMock}
            placeholder="Enter email"
            rightIcon={<Icon name="check" />}
            secureTextEntry={true}
            showClearButton={true}
            value="user@optishare.io"
          />
        </ThemeProvider>
      );
    });

    const rnInput = renderer!.root.findByType(RNTextInput);

    await act(async () => {
      rnInput.props.onFocus({} as any);
      rnInput.props.onBlur({} as any);
    });

    expect(onFocusMock).toHaveBeenCalledTimes(1);
    expect(onBlurMock).toHaveBeenCalledTimes(1);

    // Test clear press and password toggle pressable
    const pressables = renderer!.root.findAllByType(Pressable);
    for (const pressable of pressables) {
      if (pressable.props.onPress) {
        await act(async () => {
          pressable.props.onPress();
        });
      }
    }
  });

  it('renders Input without optional props cleanly', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Input placeholder="Simple input" />
        </ThemeProvider>
      );
    });

    const inputInstance = renderer!.root.findByType(Input);
    expect(inputInstance).toBeTruthy();
  });

  it('renders Loader component sizes and overlay mode', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Loader size="sm" />
          <Loader size="md" />
          <Loader message="Loading payload..." overlay={true} size="lg" />
        </ThemeProvider>
      );
    });

    const loaders = renderer!.root.findAllByType(Loader);
    expect(loaders.length).toBe(3);
  });

  it('renders Divider component horizontal and vertical', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Divider orientation="horizontal" spacing="md" thickness={1} />
          <Divider orientation="vertical" spacing="sm" thickness={2} />
        </ThemeProvider>
      );
    });

    const dividers = renderer!.root.findAllByType(Divider);
    expect(dividers.length).toBe(2);
  });

  it('renders ScreenContainer component scrollable and fixed', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <ScreenContainer padding="lg" scrollable={true}>
            <Text>Scrollable Content</Text>
          </ScreenContainer>
          <ScreenContainer padding="sm" scrollable={false}>
            <Text>Fixed Content</Text>
          </ScreenContainer>
        </ThemeProvider>
      );
    });

    const containers = renderer!.root.findAllByType(ScreenContainer);
    expect(containers.length).toBe(2);
  });

  it('renders Icon component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Icon name="sun" size={24} />
          <Icon color="#00FF00" name="moon" size={32} />
        </ThemeProvider>
      );
    });

    const icons = renderer!.root.findAllByType(Icon);
    expect(icons.length).toBe(2);
  });

  it('toggles theme between light and dark mode', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider initialMode="light">
          <ThemeTestComponent />
        </ThemeProvider>
      );
    });

    const buttonBefore = renderer!.root.findByType(Button);
    expect(buttonBefore.props.title).toBe('Light Mode');

    await act(async () => {
      buttonBefore.props.onPress();
    });

    const buttonAfter = renderer!.root.findByType(Button);
    expect(buttonAfter.props.title).toBe('Dark Mode');
  });
});
