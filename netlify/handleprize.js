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
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ message: 'Method Not Allowed' })
    };
  }

  const { user_id } = JSON.parse(event.body || '{}');
  if (!user_id) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Missing user_id' })
    };
  }

  console.log("📡 Sending request to server with user_id:", user_id);

  try {
    // Check if the user has already claimed a prize
    const { data: existingClaim, error: fetchError } = await supabase
      .from('claims')
      .select('*')
      .eq('user_id', user_id)
      .single();

    if (existingClaim) {
      return {
        statusCode: 200,
        body: JSON.stringify({
          prize: existingClaim.prize,
          unique_code: existingClaim.unique_code
        })
      };
    }

    // Handle fetch error if no records are found
    if (fetchError && fetchError.message !== 'No rows found') {
      throw fetchError;
    }

    // Randomly select a prize
    const selectedPrize = prizes[Math.floor(Math.random() * prizes.length)];
    const uniqueCode = `UKIYO-${user_id.slice(0, 8)}`;
    //-${Date.now().toString().slice(-4)}
    // Insert the new prize claim
    const { error: insertError } = await supabase
      .from('claims')
      .insert([{ user_id, prize: selectedPrize.text, unique_code: uniqueCode }]);

    if (insertError) {
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
    console.error('❌ Supabase error:', err);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Server error. Try again later.' })
    };
  }
};
