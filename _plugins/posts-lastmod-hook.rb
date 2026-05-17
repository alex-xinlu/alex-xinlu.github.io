#!/usr/bin/env ruby

require 'open3'

#
# Check for changed posts
#

Jekyll::Hooks.register :posts, :post_init do |post|
  post_path = post.relative_path
  commit_num, status = Open3.capture2('git', 'rev-list', '--count', 'HEAD', '--', post_path)
  next unless status.success?

  if commit_num.to_i > 1
    lastmod_date, status = Open3.capture2(
      'git',
      'log',
      '-1',
      '--pretty=%ad',
      '--date=iso',
      '--',
      post_path
    )

    post.data['last_modified_at'] = lastmod_date.strip if status.success?
  end
end
