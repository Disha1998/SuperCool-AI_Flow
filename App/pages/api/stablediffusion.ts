import Replicate from 'replicate';

const handler = async (req, res) => {
  if (req.method !== 'POST') {
    res.status(405).json({ message: 'Method not allowed' });
    return;
  }

  const { value } = req.body;

  try {
    const replicate = new Replicate({
    //   auth: process.env.REPLICATE_API_TOKEN,
      auth: "r8_JLaOEa8LJyagTQrD5zRFvpVsqxd5cOI475OtS",
    });

    const output = await replicate.run(
      "stability-ai/stable-diffusion:db21e45d3f7023abc2a46ee38a23973f6dce16bb082a930b0c49861f96d1e5bf",
      {                              
        input: {
          prompt: value,
          image_dimensions: "512x512",
          num_inference_steps: 12,
          num_outputs: 1,
          guideance_scale: 3.5,
          scheduler: "K_EULER",
        },
      },
    );

    res.status(200).json(output);
    console.log(output);
    
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export default handler;