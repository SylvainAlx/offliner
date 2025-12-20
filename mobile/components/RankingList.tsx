import React from "react";
import { View, Text, StyleSheet } from "react-native";
import { COLORS, SIZES } from "shared/theme";
import { formatDuration } from "shared/utils/formatDuration";

type RankingUser = {
  username: string;
  total_duration: number;
  country: string | null;
  region: string | null;
  subregion: string | null;
};

interface RankingListProps {
  users: RankingUser[] | null;
  currentUsername?: string;
}

const RankingItem = React.memo(
  ({
    item,
    index,
    isCurrentUser,
  }: {
    item: RankingUser;
    index: number;
    isCurrentUser: boolean;
  }) => (
    <View style={[styles.rankingItem, isCurrentUser && styles.currentUserItem]}>
      <Text style={[styles.rankText, isCurrentUser && styles.currentUserText]}>
        {index + 1}
      </Text>
      <Text
        style={[styles.usernameText, isCurrentUser && styles.currentUserText]}
      >
        {item.username}
      </Text>
      <Text
        style={[styles.durationText, isCurrentUser && styles.currentUserText]}
      >
        {formatDuration(item.total_duration)}
      </Text>
    </View>
  ),
);

export default function RankingList({
  users,
  currentUsername,
}: RankingListProps) {
  if (!users || users.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>Aucune donnée disponible</Text>
      </View>
    );
  }

  return (
    <View style={styles.list}>
      {users.map((item, index) => (
        <RankingItem
          key={item.username}
          item={item}
          index={index}
          isCurrentUser={item.username === currentUsername}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
    maxHeight: 400,
  },
  rankingItem: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: SIZES.padding / 2,
    paddingHorizontal: SIZES.padding,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  currentUserItem: {
    backgroundColor: COLORS.primary + "20",
    borderRadius: SIZES.borderRadius / 4,
  },
  rankText: {
    fontSize: SIZES.text_md,
    color: COLORS.accent,
    fontFamily: "Montserrat",
    fontWeight: "bold",
    width: 40,
  },
  usernameText: {
    fontSize: SIZES.text_md,
    color: COLORS.text,
    fontFamily: "Montserrat",
    flex: 1,
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
  emptyContainer: {
    padding: SIZES.padding,
    alignItems: "center",
  },
  emptyText: {
    fontSize: SIZES.text_md,
    color: COLORS.accent,
    fontFamily: "Montserrat",
  },
});
