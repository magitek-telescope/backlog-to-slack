import axios from 'axios'
import express from 'express'
import bodyParser from 'body-parser'

if (process.env.NODE_ENV !== 'production') {
  require('dotenv').config()
}

const { LINE_COLOR, HOST, PORT, DOMAIN, BOT_NAME, SLACK_URL } = process.env
const app = new express()

const ACTION_TYPES = {
  1: '追加',
  2: '更新',
  3: 'コメント',
  5: 'wiki追加',
  6: 'wiki更新',
  11: 'svn Commit',
  12: 'Git Push',
  14: '課題まとめて更新',
  18: 'Submit Pull Request',
  19: 'Update Pull Request',
  20: 'Comment Pull Request'
}

function getComment (body) {
  return (body.content.revisions ? body.content.revisions[0].comment : false) || (body.content.comment ? body.content.comment.content : false) || body.content.description
}

function getURL (body) {
  let url = DOMAIN;
  switch (body.type) {
    case 1:
    case 2:
      url += `view/${body.project.projectKey}-${body.content.key_id}`
      break;

    case 3:
      url += `view/${body.project.projectKey}-${body.content.key_id}#comment-${body.content.comment.id}`;
      break;

    case 5:
    case 6:
      url += `alias/wiki/${body.content.id}`
      break;

    case 11:
      url += `rev/${body.project.projectKey}/${body.content.rev}`
      break;

    case 12:
      url += `git/${body.project.projectKey}/${body.content.repository.name}/${body.content.revision_type}/${body.content.revisions[0].rev}`
      break;

    case 18:
    case 19:
      url += `git/${body.project.projectKey}/${body.content.repository.name}/pullRequests/${body.content.number}`
      break;

    case 20:
      url += `git/${body.project.projectKey}/${body.content.repository.name}/pullRequests/${body.content.number}#comment-${body.content.comment.id}`
      break;
  }
  return url;
}

function createPayload (channel, body) {
  const text =`[${body.project.projectKey}-${body.content.key_id}] ${ACTION_TYPES[body.type]} ${body.content.summary} by ${body.createdUser.name}
${getURL(body)}
`
  return {
    channel: channel,
    username: BOT_NAME,
    text,
    attachments: [
      {
        color: LINE_COLOR || '#42ce9f',
        fields: [
          {
            value: getComment(body),
            short: false
          }
        ]
      }
    ]
  }
}

function doSend () {

}

app.use(bodyParser());
app.post('/:channel', (req, res) => {
  axios.post(
    SLACK_URL,
    createPayload(req.params.channel, req.body)
  )
  .then(({data}) => {
    res.json({result: 'success'});
  })
})

const server = app.listen(PORT || 3000, HOST || '0.0.0.0', () => {
  const host = server.address().address;
  const port = server.address().port;
  console.log('Example app listening at http://%s:%s', host, port)
});
