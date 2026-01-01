import React from "react";
import { View, Text, StyleSheet, DimensionValue } from "react-native";
import { COLORS, SIZES } from "shared/theme";

export interface UserListItem {
  id?: string;
  username: string | null;
  [key: string]: any;
}

interface UserListProps<T extends UserListItem> {
  data: T[] | null;
  renderLeft?: (item: T, index: number) => React.ReactNode;
  renderUsername?: (item: T) => React.ReactNode;
  renderRight?: (item: T) => React.ReactNode;
  isCurrentUser?: (item: T) => boolean;
  keyExtractor?: (item: T) => string;
  emptyMessage?: string;
  maxHeight?: DimensionValue;
}

const UserListItemComponent = <T extends UserListItem>({
  item,
  index,
  isCurrentUser,
  renderLeft,
  renderUsername,
  renderRight,
}: {
  item: T;
  index: number;
  isCurrentUser: boolean;
  renderLeft?: (item: T, index: number) => React.ReactNode;
  renderUsername?: (item: T) => React.ReactNode;
  renderRight?: (item: T) => React.ReactNode;
}) => (
  <View style={[styles.item, isCurrentUser && styles.currentUserItem]}>
    {renderLeft && (
      <View style={styles.leftContainer}>{renderLeft(item, index)}</View>
    )}

    <View style={styles.centerContainer}>
      {renderUsername ? (
        renderUsername(item)
      ) : (
        <Text
          style={[styles.usernameText, isCurrentUser && styles.currentUserText]}
        >
          {item.username || "Utilisateur sans nom"}
        </Text>
      )}
    </View>

    {renderRight && (
      <View style={styles.rightContainer}>{renderRight(item)}</View>
    )}
  </View>
);

const MemoizedUserListItem = React.memo(
  UserListItemComponent,
) as typeof UserListItemComponent;

export default function UserList<T extends UserListItem>({
  data,
  renderLeft,
  renderUsername,
  renderRight,
  isCurrentUser,
  keyExtractor,
  emptyMessage = "Aucune donnée disponible",
  maxHeight = 400,
}: UserListProps<T>) {
  if (!data || data.length === 0) {
    return (
      <View style={styles.emptyContainer}>
        <Text style={styles.emptyText}>{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View style={[styles.list, { maxHeight }]}>
      {data.map((item, index) => (
        <MemoizedUserListItem
          key={
            keyExtractor
              ? keyExtractor(item)
              : item.id || item.username || index.toString()
          }
          item={item}
          index={index}
          isCurrentUser={isCurrentUser ? isCurrentUser(item) : false}
          renderLeft={renderLeft}
          renderUsername={renderUsername}
          renderRight={renderRight}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  list: {
    width: "100%",
  },
  item: {
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
  leftContainer: {
    width: 40,
  },
  centerContainer: {
    flex: 1,
  },
  rightContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  usernameText: {
    fontSize: SIZES.text_md,
    color: COLORS.text,
    fontFamily: "Montserrat",
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
