import knex from 'services/knex'

export type Attribute = {
  key: string
  value: any
}

export type CaptureFeature = {
  id: number | string
  lat: number
  lon: number
  location: string
  field_user_id: number | string
  field_username: string
  attributes: Attribute[]
  device_identifier: string | number
  created_at: string
  updated_at: string
  token_id: string
  wallet_name: string
}

export const captureFeatureFromMessage = ({
  id,
  lat,
  lon,
  field_user_id,
  field_username,
  device_identifier,
  attributes,
  created_at,
}: CaptureFeature): Readonly<CaptureFeature> => {
  return {
    id,
    lat,
    lon,
    field_user_id,
    field_username,
    device_identifier,
    attributes,
    created_at,
  } as Readonly<CaptureFeature>
}

export async function addCaptureFeature(captureFeature: CaptureFeature) {
  // Since the query uses postgres function ST_PointFromText, knex's raw function is used
  const wellKnownText = `POINT(${captureFeature.lon} ${captureFeature.lat})`
  const result = await knex.raw(
    `insert into capture_feature (
             id, lat, lon, location, field_user_id, field_username, 
             device_identifier, attributes, created_at, updated_at) 
             values(?, ?, ?, ST_PointFromText(?, 4326), ?, ?, ?, ?, ?, ?)
             returning id`,
    [
      captureFeature.id,
      captureFeature.lat,
      captureFeature.lon,
      wellKnownText,
      captureFeature.field_user_id,
      captureFeature.field_username,
      captureFeature.device_identifier,
      JSON.stringify(captureFeature.attributes),
      captureFeature.created_at,
      captureFeature.created_at,
    ],
  )
  return result.rows[0]
}
