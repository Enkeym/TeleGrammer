import { gigaAuth, gigaScope } from './config.js'
import { v4 as uuidv4 } from 'uuid'
import axios from 'axios'
import qs from 'qs'
import https from 'https'

async function getToken() {
  const config = {
    method: 'post',
    maxBodyLength: Infinity,
    url: 'https://ngw.devices.sberbank.ru:9443/api/v2/oauth',
    headers: {
      'Content-Type': 'application/x-www-form-urlencoded',
      Accept: 'application/json',
      RqUID: uuidv4(),
      Authorization: `Basic ${gigaAuth}`
    },
    data: qs.stringify({
      scope: gigaScope
    }),
    httpsAgent: new https.Agent({ rejectUnauthorized: false }) 
  }

  try {
    const response = await axios(config)
    const { access_token: accessToken, expires_at: expiresAt } = response.data

    return { accessToken, expiresAt }
  } catch (error) {
    console.error('Ошибка при получении токена:', error)
    throw error 
  }
}

async function giga(content = '', system = '') {
  try {
    const token = await getToken()

    const messages = []
    if (system) {
      messages.push({ role: 'system', content: system })
    }

    const data = JSON.stringify({
      model: 'GigaChat',
      messages: messages.concat([
        {
          role: 'user',
          content
        }
      ]),
      temperature: 1,
      top_p: 0.1,
      n: 1,
      stream: false,
      max_tokens: 512,
      repetition_penalty: 1,
      update_interval: 0
    })

    const config = {
      method: 'post',
      maxBodyLength: Infinity,
      url: 'https://gigachat.devices.sberbank.ru/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Bearer ${token.accessToken}`
      },
      data,
      httpsAgent: new https.Agent({ rejectUnauthorized: false })
    }

    const response = await axios(config)
    const message = response.data.choices[0].message
    return message.content
  } catch (error) {
    console.error('Ошибка в функции giga:', error)
    throw error
  }
}

export { giga }
