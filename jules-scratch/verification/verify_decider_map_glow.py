from playwright.sync_api import sync_playwright

def run(playwright):
    browser = playwright.chromium.launch(headless=True)
    context = browser.new_context()
    page = context.new_page()

    # Go to studio and add the element
    page.goto("http://localhost:3000/studio")
    page.get_by_role("button", name="Add Decider Map").click()
    decider_map_element = page.locator("div.react-draggable:has-text('Decider Map')")
    decider_map_element.wait_for(state="visible")
    decider_map_element.click()
    page.get_by_label("Glow Color:").fill("#FF0000")
    page.screenshot(path="jules-scratch/verification/verification_studio.png")

    # Go to broadcast view and verify
    # The broadcast view will use the active canvas by default
    page.goto(f"http://localhost:3000/broadcast/some-fake-id")
    page.wait_for_timeout(2000) # Wait for state to propagate
    decider_map_element = page.locator("div:has-text('Decider Map')")
    decider_map_element.wait_for(state="visible")
    page.screenshot(path="jules-scratch/verification/verification_broadcast.png")

    browser.close()

with sync_playwright() as playwright:
    run(playwright)
