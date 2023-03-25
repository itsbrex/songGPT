import React from "react";
import { Linking } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { HStack, Button, Icon, VStack, Text } from "native-base";
import { Logo } from "src/components/logo.component";
import { AboutUs } from "src/components/about-us.component";

export const Header = () => (
  <VStack>
    <HStack p={5} bg="gray.50" justifyContent={"center"}>
      <HStack
        flex={1}
        maxW={992}
        alignItems="center"
        justifyContent="space-between"
      >
        <HStack space={1} alignItems="center">
          <Logo />
          <AboutUs />
        </HStack>

        <Button
          bg="#316dca"
          variant="unstyled"
          borderRadius={"full"}
          onPress={() => {
            Linking.openURL("https://github.com/SoliMouse/songGPT");
          }}
          _text={{ color: "white" }}
          leftIcon={<Icon color="white" as={Ionicons} name="logo-github" />}
        >
          Star on GitHub
        </Button>
      </HStack>
    </HStack>
    <HStack p={5} bg="#316dca" justifyContent={"center"}>
      <HStack
        flex={1}
        maxW={992}
        alignItems="center"
        justifyContent="space-between"
      >
        <Text color="lightText">
          Audio playback issues may occur on some mobile devices or browsers. To
          resolve this on iPhones, ensure the device is unmuted by flipping the
          ringer switch. For the best experience, we recommend using a desktop
          computer.
        </Text>
      </HStack>
    </HStack>
  </VStack>
);
