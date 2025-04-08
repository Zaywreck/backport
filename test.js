let your_vercel_api_token_here = "58W6mvFK9bVdAHyxRzAr0Aql"

const response = await fetch(
    'https://api.vercel.com/v1/edge-config/ecfg_r5ttjeq5fpdwcyl7muoowf83nad1/items',
    {
      method: 'GET',
      headers: {
        Authorization: `Bearer ${your_vercel_api_token_here}`,
        'Content-Type': 'application/json',
      },
    }
  );
  const data = await response.json();
  console.log(data);