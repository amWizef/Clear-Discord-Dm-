import { findByProps } from "@vendetta/metro";
import { before } from "@vendetta/patcher";
import { React } from "@vendetta/metro/common";
import { getCurrentChannel } from "@vendetta/ui/discord";
import { showToast } from "@vendetta/ui/toasts";
import { findByName } from "@vendetta/metro";
import { after } from "@vendetta/patcher";

const MessageAPI = findByProps("sendMessage", "deleteMessage");
const ChannelStore = findByProps("getChannel", "getDMUserIds");
const MessageStore = findByProps("getMessages");
const Button = findByName("Button", false);
const Row = findByName("View", false);

let patch;

function deleteUserMessages(userId) {
    const channel = getCurrentChannel();
    if (!channel || channel.type !== 1) return;

    const messages = MessageStore.getMessages(channel.id)._array;
    
    let deletedCount = 0;
    messages.forEach((message) => {
        if (message.author.id === userId) {
            MessageAPI.deleteMessage(channel.id, message.id);
            deletedCount++;
        }
    });

    showToast(`Deleted ${deletedCount} messages from the user.`);
}

export default {
    onLoad: () => {
        patch = after("default", findByName("ChannelHeader", false), (_, res) => {
            const channel = getCurrentChannel();
            if (!channel || channel.type !== 1) return res; // Only apply to DMs

            const targetUser = ChannelStore.getDMUserIds(channel.id)[0];

            res.props.children.props.children.push(
                <Row style={{ marginLeft: 10 }}>
                    <Button
                        text="Clear DM"
                        size="sm"
                        color="red"
                        onPress={() => deleteUserMessages(targetUser)}
                    />
                </Row>
            );

            return res;
        });
    },
    onUnload: () => {
        if (patch) patch();
    }
};
