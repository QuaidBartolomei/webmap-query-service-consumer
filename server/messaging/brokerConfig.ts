import { BrokerConfig } from 'rascal'

export enum PublicationNames {
  WEBMAP_EVENTS = 'webmap_events',
}

export enum SubscriptionNames {
  CAPTURE_DATA = 'capture-data',
  RAW_CAPTURE_CREATED = 'raw-capture-created',
  TOKEN_ASSIGNED = 'token-assigned',
}

export enum RoutingKeys {
  CAPTURE_DATA = `webmap.capture-data.created`,
  TOKEN_ASSIGNED = `webmap.token.assign`,
  RAW_CAPTURE_CREATED = 'webmap.raw-capture.created',
}

export enum QueueNames {
  CAPTURE_DATA = `webmap:capture-data:save`,
  TOKEN_ASSIGNED = `webmap:token:assign`,
  RAW_CAPTURE_CREATED = 'webmap:raw-capture:save',
}

export const cap = {
  routingKey: `webmap.capture-data.created`,
  queueName: `webmap.capture-data.created`,
  subcriptionName: `webmap.capture-data.created`,
}

const brokerConfig: BrokerConfig = {
  vhosts: {
    'custom-vhost': {
      connection: {
        url: process.env.RABBITMQ_URL,
        socketOptions: {
          timeout: 3000,
        },
      },
      exchanges: [
        'service', // Shared exchange for all services within this vhost
        'delay', // To delay failed messages before a retry
        'retry', // To retry failed messages up to maximum number of times
        'dead_letters', // When retrying fails, messages end up here
      ],

      // A good naming convention for queues is consumer:entity:action
      queues: {
        [QueueNames.CAPTURE_DATA]: {
          options: {
            arguments: {
              // Route nacked messages to a service specific dead letter queue
              'x-dead-letter-exchange': 'dead_letters',
              'x-dead-letter-routing-key': 'webmap.dead_letter',
            },
          },
        },

        [QueueNames.TOKEN_ASSIGNED]: {
          options: {
            arguments: {
              // Route nacked messages to a service specific dead letter queue
              'x-dead-letter-exchange': 'dead_letters',
              'x-dead-letter-routing-key': 'webmap.dead_letter',
            },
          },
        },

        [QueueNames.RAW_CAPTURE_CREATED]: {
          options: {
            arguments: {
              // Route nacked messages to a service specific dead letter queue
              'x-dead-letter-exchange': 'dead_letters',
              'x-dead-letter-routing-key': 'webmap.dead_letter',
            },
          },
        },

        // Create a delay queue to hold failed messages for a short interval before retrying
        'delay:1m': {
          options: {
            arguments: {
              // Configure messages to expire after 1 minute, then route them to the retry exchange
              'x-message-ttl': 60000,
              'x-dead-letter-exchange': 'retry',
            },
          },
        },

        // Queue for holding dead letters until they can be resolved
        'dead_letters:webmap': {},
      },

      bindings: {
        [`service[${RoutingKeys.CAPTURE_DATA}] -> ${QueueNames.CAPTURE_DATA}`]:
          {},
        [`service[${RoutingKeys.TOKEN_ASSIGNED}] -> ${QueueNames.TOKEN_ASSIGNED}`]:
          {},
        [`service[${RoutingKeys.RAW_CAPTURE_CREATED}] -> ${QueueNames.RAW_CAPTURE_CREATED}`]:
          {},

        // Route delayed messages to the 1 minute delay queue
        'delay[delay.1m] -> delay:1m': {},

        // Route retried messages back to their original queue using the CC routing keys set by Rascal
        [`retry[${RoutingKeys.CAPTURE_DATA}] -> ${QueueNames.CAPTURE_DATA}`]:
          {},
        // Route dead letters the service specific dead letter queue
        'dead_letters[webmap.dead_letter] -> dead_letters:webmap': {},
      },

      publications: {
        // Always publish a notification of success (it's useful for testing if nothing else)
        save_user_succeeded: {
          exchange: 'service',
        },

        // Forward messages to the 1 minute delay queue when retrying
        retry_in_1m: {
          exchange: 'delay',
          options: {
            CC: ['delay.1m'],
          },
        },

        [PublicationNames.WEBMAP_EVENTS]: {
          exchange: 'service',
        },
      },

      subscriptions: {
        [SubscriptionNames.CAPTURE_DATA]: {
          queue: QueueNames.CAPTURE_DATA,
          contentType: 'application/json',
          redeliveries: {
            limit: 5,
            counter: 'shared',
          },
        },

        [SubscriptionNames.TOKEN_ASSIGNED]: {
          queue: QueueNames.TOKEN_ASSIGNED,
          contentType: 'application/json',
          redeliveries: {
            limit: 5,
            counter: 'shared',
          },
        },

        [SubscriptionNames.RAW_CAPTURE_CREATED]: {
          queue: QueueNames.RAW_CAPTURE_CREATED,
          contentType: 'application/json',
          redeliveries: {
            limit: 5,
            counter: 'shared',
          },
        },
      },
    },
  },

  // Define recovery strategies for different error scenarios
  recovery: {
    // Deferred retry is a good strategy for temporary (connection timeout) or unknown errors
    deferred_retry: [
      {
        strategy: 'forward',
        attempts: 10,
        publication: 'retry_in_1m',
        xDeathFix: true, // See https://github.com/rabbitmq/rabbitmq-server/issues/161
      },
      {
        strategy: 'nack',
      },
    ],

    // Republishing with immediate nack returns the message to the original queue but decorates
    // it with error headers. The next time Rascal encounters the message it immediately nacks it
    // causing it to be routed to the services dead letter queue
    dead_letter: [
      {
        strategy: 'republish',
        immediateNack: true,
      },
    ],
  },
  // Define counter(s) for counting redeliveries
  redeliveries: {
    counters: {
      shared: {
        size: 10,
        type: 'inMemory',
      },
    },
  },
}

export default brokerConfig
