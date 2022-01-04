import waitForExpect from 'wait-for-expect'
import knex, { TableNames } from 'db/knex'
import { getBroker, publish } from 'messaging/broker'
import {
  EventNames,
  PublicationNames,
  SubscriptionNames,
} from 'messaging/brokerConfig'
import registerEventHandlers from 'messaging/eventHandlers'
import { truncateTables } from 'models/base'
import { CaptureFeature } from 'models/captureFeature'

const data: CaptureFeature = {
  id: '63e00bca-8eb0-11eb-8dcd-0242ac130003',
  lat: 0.6383533333333336,
  lon: 37.663318333333336,
  field_user_id: 0,
  field_username: 'fake_name',
  token_id: '9d7abad8-8eb0-11eb-8dcd-0242ac130003',
  wallet_name: 'oldone',
  device_identifier: '',
  attributes: [],
  created_at: '2021-07-09T03:58:07.814Z',
  updated_at: '2021-07-09T03:58:07.814Z',
  location: '',
}

describe('capture created', () => {
  beforeAll(async () => {
    await registerEventHandlers()
  })

  beforeEach(async () => {
    const broker = await getBroker()
    await broker.purge()
    await truncateTables([TableNames.CAPTURE_FEATURE])
  })

  afterAll(async () => {
    const broker = await getBroker()
    await broker.unsubscribeAll()
    await broker.nuke()
  })

  it('should successfully handle captureCreated event', async () => {
    // publish the capture
    await publish(
      PublicationNames.WEBMAP_EVENTS,
      EventNames.CAPTURE_DATA,
      data,
      (e) => console.log('result:', e),
    )

    // wait for message to be consumed
    await waitForExpect(async () => {
      // check if message was consumed and handled
      const result = await knex(TableNames.CAPTURE_FEATURE)
        .select()
        .where('id', data.id)
      expect(result).toHaveLength(1)
    })
  })

  it.skip('Successfully reject captureCreated event', async () => {
    // prepare the capture before the wallet event
    await knex(TableNames.CAPTURE_FEATURE).insert(data)
    // publish the capture
    await publish(SubscriptionNames.CAPTURE_DATA, '', data, (e) =>
      console.log('result:', e),
    )
    // wait for message to be consumed
    await new Promise((r) => setTimeout(() => r(''), 3000))
    // check if message was consumed and handled
    const result = await knex(TableNames.CAPTURE_FEATURE)
      .select()
      .where('id', data.id)
    expect(result).toHaveLength(1)
  })
})
