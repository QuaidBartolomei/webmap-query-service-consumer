import { BrokerAsPromised } from 'rascal'
import { Global } from 'interfaces/global'
import brokerConfig, { SubscriptionNames } from './brokerConfig'

async function createBroker(config = brokerConfig) {
  console.log('creating broker')
  const broker = await BrokerAsPromised.create(config)
  ;(global as Global).broker = broker
  return broker
}
export function getBroker() {
  return (global as Global).broker ?? createBroker()
}

export async function publish<T>(
  publicationName: string,
  routingKey: string,
  payload: T,
  resultHandler: (messageId: string) => void,
) {
  try {
    const broker = await getBroker()
    const publication = await broker.publish(
      publicationName,
      payload,
      routingKey,
    )
    publication.on('success', resultHandler).on('error', (err, messageId) => {
      console.error(`Error with id ${messageId} ${err.message}`)
      throw err
    })
  } catch (err) {
    console.error(`Error publishing message ${err}`, err)
  }
}

export type BrokerEventHandler<T> = (
  content: T,
) => Promise<{ recoverable?: boolean; error?: Error }>

export async function subscribe<T>(
  subscriptionName: SubscriptionNames,
  eventHandler: BrokerEventHandler<T>,
) {
  try {
    const broker = await getBroker()
    const subscription = await broker.subscribe(subscriptionName)
    subscription
      .on('message', async (_message, content: T, ackOrNack) => {
        const res = await eventHandler(content)
        const { error, recoverable } = res
        if (!error) return ackOrNack()
        console.log('NACKING MESSAGE')
        ackOrNack(
          error,
          recoverable
            ? brokerConfig.recovery?.deferred_retry
            : brokerConfig.recovery?.dead_letter,
        )
      })
      .on('error', console.error)
  } catch (err) {
    console.error(`Error subscribing to ${subscriptionName}, error: ${err}`)
  }
}
