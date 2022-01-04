import { TableNames } from 'db/knex'
import { BrokerEventHandler, subscribe } from 'messaging/broker'
import { batchUpdate } from 'models/base'
import { addCaptureFeature, CaptureFeature } from 'models/captureFeature'
import {
  addRawCapture,
  assignRegion,
  updateCluster,
} from 'models/rawCaptureFeature'
import { SubscriptionNames } from './brokerConfig'

export const captureFeatureCreatedHandler: BrokerEventHandler<CaptureFeature> =
  async (message: CaptureFeature) => {
    console.log('received capture feature event message', message)
    const res = await addCaptureFeature(message)
    const error = !res?.id ? new Error('error') : undefined
    return {
      error,
      recoverable: true,
    }
  }

const rawCaptureCreatedHandler: BrokerEventHandler<CaptureFeature> = async (
  message,
) => {
  console.log('received raw capture event message', message)
  const rawCaptureFeature = { ...message }
  await addRawCapture(rawCaptureFeature)
  await assignRegion(rawCaptureFeature)
  await updateCluster(rawCaptureFeature)
  console.log('raw capture event handler finished')
  return {}
}

export type TokenMessage = {
  entries: {
    capture_id: string
  }[]
  wallet_name: string
}

const tokenAssignedHandler: BrokerEventHandler<TokenMessage> = async (
  message: TokenMessage,
) => {
  console.log('token event handler received:', message)
  const { wallet_name, entries } = message
  const ids = entries.map((entry) => entry.capture_id)
  const updateObject = {
    wallet_name,
  }
  await batchUpdate(ids, updateObject, TableNames.CAPTURE_FEATURE)
  console.log('token event handler finished.')
  return {}
}

export default async function registerEventHandlers() {
  await subscribe(SubscriptionNames.CAPTURE_DATA, captureFeatureCreatedHandler)
  await subscribe(
    SubscriptionNames.RAW_CAPTURE_CREATED,
    rawCaptureCreatedHandler,
  )
  await subscribe(SubscriptionNames.TOKEN_ASSIGNED, tokenAssignedHandler)
}
