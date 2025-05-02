const { createClient } = require('@supabase/supabase-js');

// Retrieve Supabase URL and Service Role Key from environment variables
const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// Check if environment variables are set
if (!supabaseUrl || !supabaseKey) {
  throw new Error("Supabase URL or Service Role Key is missing!");
}

const supabase = createClient(supabaseUrl, supabaseKey);

const prizes = [
  { text: '20% تخفیف منو قهوه ☕' },
  { text: '10% تخفیف منوی غذا 🍽️' },
  { text: '20 هزار تومن تخفیف خرید بالای 200 هزار تومان 💸' },
  { text: 'دسر رایگان برای خرید بالای 400 هزار تومان 🍰' }
];

exports.handler = async (event) => {
  console.log("Event received:", event);

  if (event.httpMethod !== 'POST') {
    console.error("Invalid HTTP method:", event.httpMethod);
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  let user_id;
  try {
    const body = JSON.parse(event.body || '{}');
    user_id = body.user_id;
    console.log("Parsed user_id:", user_id);
    if (!user_id) {
      throw new Error('Missing user_id');
    }
  } catch (err) {
    console.error("Error parsing request body:", err);
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Invalid request body or missing user_id' })
    };
  }

  console.log("📡 Sending request to server with user_id:", user_id);

  try {
    const { data: existingClaim, error: fetchError } = await supabase
      .from('claims')
      .select('prize, unique_code')
      .eq('user_id', user_id)
      .single();

    console.log("Existing claim:", existingClaim);
    if (fetchError) {
      console.error("Fetch error:", fetchError);
    }

    if (existingClaim) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          prize: existingClaim.prize,
          unique_code: existingClaim.unique_code
        })
      };
    }

    const selectedPrize = prizes[Math.floor(Math.random() * prizes.length)];
    const uniqueCode = `UKIYO-${user_id.slice(0, 8)}-${Math.random().toString(36).substr(2, 6)}`;
    console.log("Selected prize:", selectedPrize, "Unique code:", uniqueCode);

    const { error: insertError } = await supabase
      .from('claims')
      .insert([{ user_id, prize: selectedPrize.text, unique_code: uniqueCode }]);

    if (insertError) {
      console.error("Insert error:", insertError);
      throw insertError;
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        prize: selectedPrize.text,
        unique_code: uniqueCode
      })
    };
  } catch (err) {
    console.error("❌ Supabase error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error. Try again later.' })
    };
  }
};
