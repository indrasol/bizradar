import json
import os
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
    logger = get_logger(__name__)
    logger.info(f"parse_company_website_mcp: start url={url}")

    # Configure OpenAI for the agent SDK
    set_default_openai_key(OPENAI_API_KEY)
    logger.debug("parse_company_website_mcp: OpenAI key configured (present=%s)", bool(OPENAI_API_KEY))

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

    browsers_path = os.getenv("PLAYWRIGHT_BROWSERS_PATH")
    logger.debug(
        "parse_company_website_mcp: browsers_path=%s exists=%s",
        browsers_path,
        os.path.isdir(browsers_path) if browsers_path else False,
    )

    try:
        # Prefer globally installed MCP; fallback to npx
        mcp_cmd = os.getenv("MCP_CMD", "playwright-mcp")
        mcp_args = os.getenv("MCP_ARGS", "").split(" ") if os.getenv("MCP_ARGS", "") else []
        async with MCPServerStdio(
            name="Playwright-mcp",
            params={"command": mcp_cmd, "args": mcp_args},
        ) as server:
            logger.info("parse_company_website_mcp: MCP server started via %s %s", mcp_cmd, " ".join(mcp_args))
            agent = Agent(
                name="Playwright-mcp",
                model="gpt-4.1-mini",
                instructions=instruction,
                mcp_servers=[server],
            )
            logger.debug("parse_company_website_mcp: running agent with model=%s", "gpt-4.1-mini")
            result = await Runner.run(agent, url)
            text = (result.final_output or "").strip()
            logger.debug("parse_company_website_mcp: received output length=%d", len(text))
            if text.startswith("```"):
                logger.debug("parse_company_website_mcp: output wrapped in code fences; unwrapping")
                if "```json" in text:
                    text = text.split("```json", 1)[1].rsplit("```", 1)[0].strip()
                else:
                    text = text.strip("`\n")
            end_time = time.time()
            logger.info("parse_company_website_mcp: finished in %.2fs", end_time - start_time)
            try:
                parsed = json.loads(text or "{}")
                logger.debug("parse_company_website_mcp: json parsed successfully; keys=%s", list(parsed.keys())[:10])
                return parsed
            except json.JSONDecodeError as e:
                logger.exception(
                    "parse_company_website_mcp: JSON decode failed: %s. First 500 chars: %s",
                    str(e),
                    text[:500],
                )
                raise
    except Exception as e:  # pragma: no cover
        logger.exception("parse_company_website_mcp: MCP execution failed: %s", str(e))
        raise


__all__ = [
    "parse_company_website_mcp",
]


async def check_mcp_readiness(timeout_seconds: float = 15.0) -> bool:
    """
    Attempt to start the MCP server and immediately close it to verify availability.
    Returns True if the server starts without error, False otherwise.
    """
    logger = get_logger(__name__)
    try:
        mcp_cmd = os.getenv("MCP_CMD", "playwright-mcp")
        mcp_args = os.getenv("MCP_ARGS", "").split(" ") if os.getenv("MCP_ARGS", "") else []
        logger.debug("check_mcp_readiness: command=%s args=%s", mcp_cmd, mcp_args)
        start = time.time()
        async with MCPServerStdio(
            name="Playwright-mcp",
            params={"command": mcp_cmd, "args": mcp_args},
        ) as server:
            # No-op interaction, just ensure startup succeeds
            pass
        logger.info("check_mcp_readiness: MCP started in %.2fs", time.time() - start)
        return True
    except Exception as e:
        logger.exception("check_mcp_readiness: MCP startup failed: %s", str(e))
        return False

