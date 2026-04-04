exports.handler = async (event) => {
  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, body: 'Method Not Allowed' };
  }

  const PAT = process.env.GITHUB_PAT;
  if (!PAT) {
    return { statusCode: 500, body: JSON.stringify({ error: 'GITHUB_PAT not configured' }) };
  }

  let newData;
  try {
    newData = JSON.parse(event.body);
  } catch {
    return { statusCode: 400, body: JSON.stringify({ error: 'Invalid JSON' }) };
  }

  const apiUrl = 'https://api.github.com/repos/sriharimaneru/goals-tracker/contents/data.json';
  const headers = {
    'Authorization': `Bearer ${PAT}`,
    'Accept': 'application/vnd.github+json',
    'Content-Type': 'application/json',
    'X-GitHub-Api-Version': '2022-11-28',
  };

  // Get current SHA (required for updates)
  const getRes = await fetch(apiUrl, { headers });
  if (!getRes.ok) {
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to fetch current file' }) };
  }
  const { sha } = await getRes.json();

  // Commit updated data.json
  const putRes = await fetch(apiUrl, {
    method: 'PUT',
    headers,
    body: JSON.stringify({
      message: 'Update goals data',
      content: Buffer.from(JSON.stringify(newData, null, 2)).toString('base64'),
      sha,
    }),
  });

  if (!putRes.ok) {
    const detail = await putRes.text();
    return { statusCode: 502, body: JSON.stringify({ error: 'Failed to save', detail }) };
  }

  return { statusCode: 200, body: JSON.stringify({ ok: true }) };
};
