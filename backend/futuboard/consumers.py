from channels.generic.websocket import AsyncWebsocketConsumer
import json


class BoardConsumer(AsyncWebsocketConsumer):
    async def connect(self):
        self.board_id = self.scope["url_route"]["kwargs"]["board_id"]

        await self.channel_layer.group_add(str(self.board_id), self.channel_name)
        await self.accept()

    async def disconnect(self, close_code):
        await self.channel_layer.group_discard(str(self.board_id), self.channel_name)

    async def receive(self, text_data):
        message = text_data
        await self.channel_layer.group_send(
            str(self.board_id),
            {
                "type": "board_update",
                "message": message,
            },
        )

    async def board_update(self, event):
        # Extract the message from the event
        message = event["message"]
        # Send the message to the WebSocket
        await self.send(text_data=json.dumps({"message": message}))
