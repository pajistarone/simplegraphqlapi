const { GraphQLServer, PubSub } = require('graphql-yoga')

const dummyMessages = []

function dbMessageGet(){
	return dummyMessages
}

function dbMessageGetById(id){
	return dummyMessages[id - 1]
}

function dbMessageInsert(newMessage){
	newMessage.id = dummyMessages.length == 0? 1 : dummyMessages[dummyMessages.length-1].id + 1; // id automatically generated in database after insert
	dummyMessages.push(newMessage)
	return newMessage
}

const pubsub = new PubSub()
const CHANNEL = 'CHANNEL'
const resolvers = {
	Query: {
		message: (root, { id }) => ({ id }),
		messages: (root) => dbMessageGet()
	},
	Mutation: {
		sendMessage: (root, { text }) => {
			let msg = {
				text: text
			}
			
			var messageInserted = dbMessageInsert(msg) // messageInserted contains new id
			pubsub.publish(CHANNEL, { newMessage: messageInserted })
			
			return messageInserted
		}
	},
	Subscription: {
		newMessage: {
			subscribe: (root, args, { pubsub }) => {
				return pubsub.asyncIterator(CHANNEL)
			}
		}
	},
	Message: {
		id: ({ id }) => dbMessageGetById(id) == null ? null : dbMessageGetById(id).id,
		text: ({ id }) => dbMessageGetById(id) == null ? null : dbMessageGetById(id).text
	}
}


const server = new GraphQLServer({
	typeDefs: './src/schema.graphql',
	resolvers: resolvers,
	context: { pubsub }
})

server.start(() => console.log(`Server is running on http://localhost:4000`))