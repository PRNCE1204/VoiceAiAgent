const Gemini_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent"


export const generateGeminiResponse = async ({
    prompt,
    apikey,
    user
}) => {
    try {

        if (!apikey) {
            throw new Error("Gemini API key missing")
        }

        const response = await fetch(`${Gemini_URL}?key=${apikey}`, {
            method: "POST",
            headers: {
                "Content-Type":
                    "application/json",
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })

        })

        if (!response.ok) {

        // Invalid API Key
        if (
          response.status === 400 ||
          response.status === 401
        ) {

          user.geminiStatus =
            "invalid";

          await user.save();
        }

        // Quota Exceeded
        if (
          response.status === 429
        ) {

          user.geminiStatus =
            "quota_exceeded";

          await user.save();
        }

        const err =
          await response.text();

        throw new Error(err);
      }

      // =========================
      // SUCCESS STATUS
      // =========================

      user.geminiStatus =
        "active";

      await user.save();

      const data = await response.json()
      

      const text = data.candidates?.[0]
        ?.content?.parts?.[0]
        ?.text;

         if (!text) {

        throw new Error(
          "No text returned from Gemini"
        );
      }

      return text.trim();
    } catch (error) {

         console.error(
        "Gemini Fetch Error:",
        error.message
      );

      throw new Error(
        "Gemini API fetch failed"
      );

    }
}

export const streamGeminiResponse = async ({
    prompt,
    apikey,
    onChunk
}) => {
    try {
        if (!apikey) {
            throw new Error("Gemini API key missing")
        }

        const streamUrl = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:streamGenerateContent?key=${apikey}`;
        const response = await fetch(streamUrl, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                contents: [
                    {
                        parts: [
                            {
                                text: prompt
                            }
                        ]
                    }
                ]
            })
        });

        if (!response.ok) {
            const err = await response.text();
            throw new Error(err);
        }

        const reader = response.body.getReader();
        const decoder = new TextDecoder("utf-8");
        let buffer = "";

        while (true) {
            const { value, done } = await reader.read();
            if (done) break;

            buffer += decoder.decode(value, { stream: true });

            let braceCount = 0;
            let startIdx = 0;

            for (let i = 0; i < buffer.length; i++) {
                if (buffer[i] === "{") {
                    if (braceCount === 0) {
                        startIdx = i;
                    }
                    braceCount++;
                } else if (buffer[i] === "}") {
                    braceCount--;
                    if (braceCount === 0) {
                        const jsonStr = buffer.substring(startIdx, i + 1);
                        try {
                            const chunkData = JSON.parse(jsonStr);
                            const text = chunkData.candidates?.[0]?.content?.parts?.[0]?.text;
                            if (text) {
                                onChunk(text);
                            }
                        } catch (e) {
                            // Incomplete JSON, skip
                        }
                        buffer = buffer.substring(i + 1);
                        i = -1; // restart search
                    }
                }
            }
        }
    } catch (error) {
        console.error("Gemini Streaming Error:", error);
        throw error;
    }
};

export const generateEmbedding = async (text, apikey) => {
    try {
        if (!apikey) {
            throw new Error("Gemini API key missing")
        }

        const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/text-embedding-004:embedContent?key=${apikey}`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                model: "models/text-embedding-004",
                content: { parts: [{ text }] }
            })
        });

        if (!response.ok) {
            throw new Error(await response.text());
        }

        const data = await response.json();
        return data.embedding.values;
    } catch (e) {
        console.error("Embedding generation failed:", e);
        throw e;
    }
};