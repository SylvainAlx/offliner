import React from "react";
import { StyleSheet,Text } from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";

import UserList, { UserListItem } from "./UserList";

interface RankingUser extends UserListItem {
  total_duration: number;
}

interface RankingListProps {
  users: RankingUser[] | null;
  currentUsername?: string;
}

export default function RankingList({
  users,
  currentUsername,
}: RankingListProps) {
  return (
    <UserList<RankingUser>
      data={users}
      isCurrentUser={(item: RankingUser) => item.username === currentUsername}
      keyExtractor={(item: RankingUser) => item.username || ""}
      renderLeft={(_: RankingUser, index: number) => (
        <Text
          style={[
            styles.rankText,
            users?.[index]?.username === currentUsername &&
              styles.currentUserText,
          ]}
        >
          {index + 1}
        </Text>
      )}
      renderRight={(item: RankingUser) => (
        <Text
          style={[
            styles.durationText,
            item.username === currentUsername && styles.currentUserText,
          ]}
        >
          {formatDuration(item.total_duration)}
        </Text>
      )}
    />
  );
}

const styles = StyleSheet.create({
  rankText: {
    fontSize: SIZES.text_md,
    color: COLORS.accent,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    width: 40,
  },
  durationText: {
    fontSize: SIZES.text_md,
    color: COLORS.secondary,
    fontFamily: "Doto",
    fontWeight: "bold",
  },
  currentUserText: {
    color: COLORS.primary,
    fontWeight: "bold",
  },
});
