just add environment variable `GOOGLE_API_KEY` and just run `npx auto-commit-gemini` to create commit in english, for example in fish shell set it like this in `~/.config/fish/config.fish` last line:

```
set -x GOOGLE_API_KEY <your api key>
```

then run `source ~/.config/fish/config.fish`

only push to main for now