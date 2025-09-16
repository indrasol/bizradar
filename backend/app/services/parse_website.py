import json
from typing import Dict, Any
import time
from app.utils.logger import get_logger

try:    
    from app.config.settings import OPENAI_API_KEY
except:
    from config.settings import OPENAI_API_KEY

try:
    from agents import Agent, Runner, set_default_openai_key
    from agents.mcp import MCPServerStdio
except Exception as _e:  # pragma: no cover
    raise ImportError("agents package is required. Install with: pip install agents")


async def parse_company_website_mcp(url: str) -> Dict[str, Any]:
    """
    Use the Playwright MCP server (spawned via stdio) together with OpenAI APIs
    to crawl `url` and return a JSON dict with the schema:

    {
      company,
      objective,
      headquarters: { address, city, state, country },
      offices: [{ address, city, state, country }],
      contact: { phone, primary_email, secondary_phone, secondary_email, linkedin, x, instagram, youtube, other[] },
      key_competencies: [{ service, summary, offerings[], certifications[] }],
      clients: [{ name, title, organization, comments }],
      employees: { total_count, employee_info: [{ name, competency, contact_info }] },
      meta_data: { ...any other important information }
    }

    """
    # Configure OpenAI for the agent SDK
    set_default_openai_key(OPENAI_API_KEY)
    start_time = time.time()

    # Strong instruction to return ONLY the requested JSON
    instruction = (
        "Crawl the website and extract everything about the company possible. "
        "Return ONLY a JSON object with EXACT keys and structure: "
        "{company, objective, headquarters{address,city,state,country}, offices[{address,city,state,country}], "
        "contact{phone,primary_email,secondary_phone,secondary_email,linkedin,x,instagram,youtube,other}, "
        "key_competencies[{service,summary,offerings,certifications}], clients[{name,title,organization,comments}], "
        "employees{total_count,employee_info[{name,competency,contact_info}]}, meta_data}."
    )

    async with MCPServerStdio(
        name="Playwright-mcp",
        params={"command": "npx", "args": ["-y", "@playwright/mcp@latest"]},
    ) as server:
        agent = Agent(
            name="Playwright-mcp",
            model="gpt-4.1-mini",
            instructions=instruction,
            mcp_servers=[server],
        )
        result = await Runner.run(agent, url)
        text = (result.final_output or "").strip()
        if text.startswith("```"):
            if "```json" in text:
                text = text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
            else:
                text = text.strip("`\n")
        end_time = time.time()
        # logger.info(f"Time taken to parse company website: {end_time - start_time} seconds")
        print(f"Time taken to parse company website: {end_time - start_time} seconds")
        return json.loads(text or "{}")


__all__ = [
    "parse_company_website_mcp",
]

