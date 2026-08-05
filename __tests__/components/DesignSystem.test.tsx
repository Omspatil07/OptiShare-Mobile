/**
 * Design System Component Test Suite
 *
 * Verifies rendering, theme context, interaction handling,
 * and accessibility props across design system components.
 */

import React from 'react';
import ReactTestRenderer, { act } from 'react-test-renderer';
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
  it('renders Text component with variants correctly', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Text variant="h1">Heading Title</Text>
          <Text variant="body1">Body Content</Text>
        </ThemeProvider>
      );
    });

    const textNodes = renderer!.root.findAllByType(Text);
    expect(textNodes.length).toBe(2);
    expect(textNodes[0].props.children).toBe('Heading Title');
    expect(textNodes[1].props.children).toBe('Body Content');
  });

  it('handles Button presses and displays loading state', async () => {
    const onPressMock = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Button onPress={onPressMock} title="Submit Button" />
        </ThemeProvider>
      );
    });

    const buttonInstance = renderer!.root.findByType(Button);
    expect(buttonInstance.props.title).toBe('Submit Button');

    // Trigger press
    await act(async () => {
      buttonInstance.props.onPress();
    });
    expect(onPressMock).toHaveBeenCalledTimes(1);

    // Test loading state
    await act(async () => {
      renderer.update(
        <ThemeProvider>
          <Button loading={true} onPress={onPressMock} title="Submit Button" />
        </ThemeProvider>
      );
    });

    const loaderInstance = renderer!.root.findByType(Loader);
    expect(loaderInstance).toBeTruthy();
  });

  it('renders Card component with press interaction', async () => {
    const onCardPress = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Card onPress={onCardPress} variant="elevated">
            <Text>Card Children</Text>
          </Card>
        </ThemeProvider>
      );
    });

    const cardInstance = renderer!.root.findByType(Card);
    expect(cardInstance).toBeTruthy();

    await act(async () => {
      cardInstance.props.onPress();
    });
    expect(onCardPress).toHaveBeenCalledTimes(1);
  });

  it('renders Input component and handles text change', async () => {
    const onChangeTextMock = jest.fn();
    let renderer: ReactTestRenderer.ReactTestRenderer;

    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Input
            label="Email Input"
            onChangeText={onChangeTextMock}
            placeholder="Enter email"
            value=""
          />
        </ThemeProvider>
      );
    });

    const inputInstance = renderer!.root.findByType(Input);
    expect(inputInstance.props.label).toBe('Email Input');

    await act(async () => {
      inputInstance.props.onChangeText('test@optishare.io');
    });
    expect(onChangeTextMock).toHaveBeenCalledWith('test@optishare.io');
  });

  it('renders Loader component overlay', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Loader message="Loading payload..." overlay={true} />
        </ThemeProvider>
      );
    });

    const loaderInstance = renderer!.root.findByType(Loader);
    expect(loaderInstance.props.message).toBe('Loading payload...');
    expect(loaderInstance.props.overlay).toBe(true);
  });

  it('renders Divider component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Divider />
        </ThemeProvider>
      );
    });

    const dividerInstance = renderer!.root.findByType(Divider);
    expect(dividerInstance).toBeTruthy();
  });

  it('renders ScreenContainer component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <ScreenContainer>
            <Text>Screen Content</Text>
          </ScreenContainer>
        </ThemeProvider>
      );
    });

    const containerInstance = renderer!.root.findByType(ScreenContainer);
    expect(containerInstance).toBeTruthy();
  });

  it('renders Icon component', async () => {
    let renderer: ReactTestRenderer.ReactTestRenderer;
    await act(async () => {
      renderer = ReactTestRenderer.create(
        <ThemeProvider>
          <Icon name="sun" size={24} />
        </ThemeProvider>
      );
    });

    const iconInstance = renderer!.root.findByType(Icon);
    expect(iconInstance.props.name).toBe('sun');
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
