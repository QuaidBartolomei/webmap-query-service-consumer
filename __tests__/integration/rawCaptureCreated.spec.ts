import capture_in_kenya from '@test/mock/capture_in_kenya.json'
import { publishMessage, truncateTables } from '@test/utils'
import waitForExpect from 'wait-for-expect'
import knex, { TableNames } from 'db/knex'
import { SubscriptionNames } from 'messaging/brokerConfig'
import registerEventHandlers from 'messaging/eventHandlers'

// check the region data, make sure the sample data has been imported from mock/xxx.copy
/*
     * the result from dev DB
     *
        treetracker_dev=> select DISTINCT ON (tree_id, zoom_level) trees.id as tree_id, zoom_level, region.id from (
        select id,lat,lon,estimated_geometric_location from trees where id = 928260
        ) trees
        join region
        ON ST_Contains( region.geom, trees.estimated_geometric_location)
        join region_zoom on region_zoom.region_id = region.id;
         tree_id | zoom_level |   id
        ---------+------------+---------
          928260 |          1 | 6632476
          928260 |          2 |   22905
          928260 |          3 | 6632611
          928260 |          4 | 6632476
          928260 |          5 | 6632476
          928260 |          6 |   22905
          928260 |          7 |   22905
          928260 |          8 |   22905
          928260 |          9 | 2281072
          928260 |         10 | 2281072
          928260 |         11 | 2281072
          928260 |         12 | 2281072
          928260 |         13 | 2281072
          928260 |         14 | 2281072
          928260 |         15 | 5447363
      (15 rows)
      */

describe('rawCaptureFeature', () => {
  beforeAll(async () => {
    await registerEventHandlers()
  })

  beforeEach(async () => {
    await truncateTables([
      TableNames.CAPTURE_FEATURE,
      TableNames.RAW_CAPTURE_FEATURE,
      TableNames.REGION_ASSIGNMENT,
      TableNames.RAW_CAPTURE_CLUSTER,
    ])
  })

  it('Successfully handle raw capture created event', async () => {
    // just care about the 14 zoom level
    const cluster_zoom_level = 14

    // prepare two clusters, the new capture will find the nearest to update
    await knex(TableNames.RAW_CAPTURE_CLUSTER).insert({
      zoom_level: cluster_zoom_level,
      location: `POINT(${capture_in_kenya.lon + 1} ${capture_in_kenya.lat})`,
      count: 1,
    })

    // a farther cluster
    await knex(TableNames.RAW_CAPTURE_CLUSTER).insert({
      zoom_level: cluster_zoom_level,
      location: `POINT(${capture_in_kenya.lon + 2} ${capture_in_kenya.lat})`,
      count: 5,
    })

    // prepare the capture before the wallet event
    const message = capture_in_kenya
    await publishMessage(
      SubscriptionNames.RAW_CAPTURE_CREATED,
      message,
      '',
      () => console.log('message received'),
    )

    await waitForExpect(async () => {
      const result = await knex(TableNames.RAW_CAPTURE_FEATURE)
        .select()
        .where('id', capture_in_kenya.id)
      expect(result).toHaveLength(1)
    })

    await waitForExpect(async () => {
      const result = await knex(TableNames.REGION_ASSIGNMENT).select().where({
        map_feature_id: capture_in_kenya.id,
        zoom_level: 9,
        region_id: 2281072,
      })
      expect(result).toHaveLength(1)
    })

    await waitForExpect(async () => {
      const result = await knex(TableNames.REGION_ASSIGNMENT).select().where({
        map_feature_id: capture_in_kenya.id,
      })
      expect(result).toHaveLength(15)
    })

    await waitForExpect(async () => {
      const result = await knex(TableNames.RAW_CAPTURE_CLUSTER).select().where({
        count: 2,
      })
      expect(result).toHaveLength(1)
    })
  })
})
